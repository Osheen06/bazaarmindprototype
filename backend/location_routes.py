"""
BazaarMind location and real-world market discovery routes.

Google Places is used only to discover nearby real-world market locations.
It does not provide BazaarMind intelligence, vendor prices, inventory,
participation, or shopper demand.
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from market_discovery import search_nearby_markets, is_configured
from utils import haversine_km

logger = logging.getLogger("bazaarmind.location")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class RegisterDiscoveredMarket(BaseModel):
    placeId: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    address: Optional[str] = None
    lat: float
    lng: float
    primaryType: Optional[str] = None
    types: list[str] = Field(default_factory=list)
    googleMapsUri: Optional[str] = None


def build_router(db):
    router = APIRouter()

    @router.get("/markets/discovery/status")
    async def discovery_status():
        configured = is_configured()
        return {
            "ok": True,
            "configured": configured,
            "provider": "GOOGLE_PLACES" if configured else None,
        }

    @router.get("/market/discover")
    @router.get("/markets/discover-nearby")
    async def discover_markets(
        lat: float = Query(..., ge=-90, le=90),
        lng: float = Query(..., ge=-180, le=180),
        radiusKm: float = Query(10.0, gt=0, le=50.0),
        maxResults: int = Query(20, ge=1, le=20),
    ):
        places = []
        try:
            places = await search_nearby_markets(
                lat=lat,
                lng=lng,
                radius_km=radiusKm,
                max_results=maxResults,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            logger.warning("Places search error (%s), using local fallback: %s", type(exc).__name__, exc)

        normalized = []
        for place in places:
            place_lat = place.get("lat")
            place_lng = place.get("lng")
            if not isinstance(place_lat, (int, float)) or not isinstance(place_lng, (int, float)):
                continue

            normalized.append({
                **place,
                "distanceKm": round(
                    haversine_km(lat, lng, float(place_lat), float(place_lng)),
                    3,
                ),
                "discoveryOnly": True,
                "intelligenceAvailable": False,
            })

        # If external places is empty or unauthenticated, provide registered local markets
        if not normalized:
            db_markets = await db.markets.find({}, {"_id": 0}).to_list(50)
            for m in db_markets:
                m_lat, m_lng = m.get("lat"), m.get("lng")
                if m_lat is not None and m_lng is not None:
                    d_km = round(haversine_km(lat, lng, float(m_lat), float(m_lng)), 2)
                    is_demo = m.get("id", "").startswith("demo-") or m.get("synthetic", False)
                    normalized.append({
                        "id": m.get("id"),
                        "name": m.get("name"),
                        "displayName": m.get("name"),
                        "address": m.get("area", ""),
                        "lat": m_lat,
                        "lng": m_lng,
                        "distanceKm": d_km,
                        "discoveryOnly": m.get("discoveryOnly", False),
                        "state": "DEMO" if is_demo else ("LIVE" if m.get("signalCount", 0) > 0 else "INSUFFICIENT_DATA"),
                        "intelligenceAvailable": is_demo,
                    })

        normalized.sort(key=lambda item: item["distanceKm"])
        configured = is_configured()

        return {
            "ok": True,
            "configured": configured,
            "provider": "GOOGLE_PLACES" if (configured and places) else "BAZAARMIND_LOCAL",
            "origin": {"lat": lat, "lng": lng},
            "radiusKm": radiusKm,
            "count": len(normalized),
            "places": normalized,
            "markets": normalized,
        }

    @router.post("/markets/register-discovered")
    async def register_discovered_market(payload: RegisterDiscoveredMarket):
        if not (-90 <= payload.lat <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude.")
        if not (-180 <= payload.lng <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude.")

        market_id = f"google-{payload.placeId}"
        now = now_iso()

        # IMPORTANT: createdAt is ONLY in $setOnInsert.
        # Putting it in both $set and $setOnInsert causes MongoDB's
        # "Updating the path 'createdAt' would create a conflict" error.
        market_doc = {
            "id": market_id,
            "name": payload.name,
            "address": payload.address or "",
            "lat": float(payload.lat),
            "lng": float(payload.lng),
            "placeId": payload.placeId,
            "primaryType": payload.primaryType,
            "types": payload.types,
            "googleMapsUri": payload.googleMapsUri,
            "area": payload.address or "",
            "community": None,
            "synthetic": False,
            "discoveryOnly": True,
            "discoveryProvider": "GOOGLE_PLACES",
            "intelligenceAvailable": False,
            "dataSource": "REAL",
            "updatedAt": now,
        }

        try:
            result = await db.markets.update_one(
                {"placeId": payload.placeId},
                {
                    "$set": market_doc,
                    "$setOnInsert": {"createdAt": now},
                },
                upsert=True,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Could not register discovered market: {exc}",
            ) from exc

        market = await db.markets.find_one(
            {"placeId": payload.placeId},
            {"_id": 0},
        )
        if not market:
            raise HTTPException(
                status_code=500,
                detail="Market was registered but could not be retrieved.",
            )

        return {
            "ok": True,
            "market": market,
            "created": result.upserted_id is not None,
            "updated": result.modified_count > 0 and result.upserted_id is None,
        }

    @router.get("/markets/discovered/{market_id}")
    async def get_discovered_market(market_id: str):
        market = await db.markets.find_one(
            {"id": market_id},
            {"_id": 0},
        )
        if not market:
            raise HTTPException(status_code=404, detail="Market not found.")
        return {"ok": True, "market": market}

    async def ensure_indexes():
        try:
            await db.markets.create_index(
                [("placeId", 1)],
                unique=True,
                sparse=True,
            )
            await db.markets.create_index([("dataSource", 1)])
            await db.markets.create_index([("discoveryProvider", 1)])
        except Exception:
            # Do not prevent application startup because of an index issue.
            pass

    router.ensure_indexes = ensure_indexes
    return router

import asyncio
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.attraction import Attraction, AttractionSlot
from app.data.catalog_templates import REAL_ATTRACTIONS


async def seed():
    async with AsyncSessionLocal() as db:
        today = datetime.now().date()
        date_strings = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(5)]

        for item in REAL_ATTRACTIONS:
            res = await db.execute(select(Attraction).where(Attraction.title == item["title"]))
            attraction = res.scalars().first()

            if not attraction:
                attraction = Attraction(
                    title=item["title"],
                    island=item["island"],
                    category=item["category"],
                    base_price_inr=item["base_price_inr"],
                    foreign_price_inr=item["foreign_price_inr"],
                )
                db.add(attraction)
                await db.commit()
                await db.refresh(attraction)
                print(f"Created Attraction: {attraction.title}")
            else:
                print(f"Attraction already exists: {attraction.title}")

            for d_str in date_strings:
                for start_t, end_t, cap in item["slots"]:
                    slot_res = await db.execute(
                        select(AttractionSlot).where(
                            AttractionSlot.attraction_id == attraction.id,
                            AttractionSlot.slot_date == d_str,
                            AttractionSlot.start_time == start_t,
                        )
                    )
                    existing_slot = slot_res.scalars().first()
                    if not existing_slot:
                        slot = AttractionSlot(
                            attraction_id=attraction.id,
                            slot_date=d_str,
                            start_time=start_t,
                            end_time=end_t,
                            total_capacity=cap,
                            booked_count=0,
                        )
                        db.add(slot)

        await db.commit()
        print("Catalog & 5-day slots seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())

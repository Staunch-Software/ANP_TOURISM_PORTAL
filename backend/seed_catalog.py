import asyncio
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.attraction import Attraction, AttractionSlot

REAL_ATTRACTIONS = [
    {
        "title": "Cellular Jail National Memorial",
        "island": "PORT_BLAIR",
        "category": "MONUMENT",
        "base_price_inr": 30.00,
        "foreign_price_inr": 100.00,
        "slots": [
            ("09:00", "10:00", 300),
            ("10:00", "11:00", 300),
            ("11:00", "12:00", 300),
            ("13:00", "14:00", 300),
            ("14:00", "15:00", 300),
            ("15:00", "16:00", 300),
        ],
    },
    {
        "title": "Cellular Jail Light & Sound Show",
        "island": "PORT_BLAIR",
        "category": "LIGHT_SOUND",
        "base_price_inr": 150.00,
        "foreign_price_inr": 300.00,
        "slots": [
            ("18:00", "19:00", 250),
            ("19:15", "20:15", 250),
            ("20:30", "21:30", 250),
        ],
    },
    {
        "title": "Ross Island (Netaji Subhash Chandra Bose Dweep)",
        "island": "PORT_BLAIR",
        "category": "MONUMENT",
        "base_price_inr": 50.00,
        "foreign_price_inr": 200.00,
        "slots": [
            ("08:30", "11:30", 400),
            ("12:30", "15:30", 400),
        ],
    },
    {
        "title": "Elephant Beach Scuba Diving & Sea Walk",
        "island": "HAVELOCK",
        "category": "WATER_SPORT",
        "base_price_inr": 2500.00,
        "foreign_price_inr": 3500.00,
        "slots": [
            ("08:00", "10:00", 30),
            ("10:30", "12:30", 30),
            ("13:00", "15:00", 30),
        ],
    },
    {
        "title": "North Bay Coral Glass-Bottom Safari",
        "island": "PORT_BLAIR",
        "category": "WATER_SPORT",
        "base_price_inr": 800.00,
        "foreign_price_inr": 1500.00,
        "slots": [
            ("09:00", "11:00", 50),
            ("11:30", "13:30", 50),
            ("14:00", "16:00", 50),
        ],
    },
]


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

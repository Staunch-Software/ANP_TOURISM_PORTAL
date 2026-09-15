import asyncio
from datetime import date, time, timedelta

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.ferry import Vessel, FerrySchedule, FerrySeat


async def seed_ferry_data():
    async with AsyncSessionLocal() as db:
        vessels_data = [
            {"name": "MV Makruzz Diamond", "operator": "Makruzz Catamarans", "capacity": 120},
            {"name": "Green Ocean 1", "operator": "Green Ocean Lines", "capacity": 100},
        ]

        vessel_map = {}
        for v_data in vessels_data:
            res = await db.execute(select(Vessel).where(Vessel.name == v_data["name"]))
            vessel = res.scalars().first()
            if not vessel:
                vessel = Vessel(
                    name=v_data["name"],
                    operator_name=v_data["operator"],
                    total_capacity=v_data["capacity"],
                )
                db.add(vessel)
                await db.commit()
                await db.refresh(vessel)
                print(f"Created Vessel: {vessel.name}")
            else:
                print(f"Vessel exists: {vessel.name}")
            vessel_map[vessel.name] = vessel

        today = date.today()
        dates = [today + timedelta(days=i) for i in range(5)]

        route_templates = [
            {
                "vessel": "MV Makruzz Diamond",
                "src": "PORT_BLAIR",
                "dst": "HAVELOCK",
                "dep_time": time(8, 0),
            },
            {
                "vessel": "MV Makruzz Diamond",
                "src": "HAVELOCK",
                "dst": "NEIL",
                "dep_time": time(11, 30),
            },
            {
                "vessel": "Green Ocean 1",
                "src": "PORT_BLAIR",
                "dst": "HAVELOCK",
                "dep_time": time(9, 30),
            },
            {
                "vessel": "Green Ocean 1",
                "src": "NEIL",
                "dst": "PORT_BLAIR",
                "dep_time": time(16, 0),
            },
        ]

        for d in dates:
            for rt in route_templates:
                v = vessel_map[rt["vessel"]]
                res = await db.execute(
                    select(FerrySchedule).where(
                        FerrySchedule.vessel_id == v.id,
                        FerrySchedule.source_port == rt["src"],
                        FerrySchedule.destination_port == rt["dst"],
                        FerrySchedule.departure_date == d,
                        FerrySchedule.departure_time == rt["dep_time"],
                    )
                )
                sched = res.scalars().first()
                if not sched:
                    sched = FerrySchedule(
                        vessel_id=v.id,
                        source_port=rt["src"],
                        destination_port=rt["dst"],
                        departure_date=d,
                        departure_time=rt["dep_time"],
                        status="SCHEDULED",
                    )
                    db.add(sched)
                    await db.commit()
                    await db.refresh(sched)
                    print(f"Created Schedule: {rt['src']} -> {rt['dst']} on {d} ({rt['dep_time']})")

                    seats_to_add = []
                    for row in range(1, 7):
                        for col in ["A", "B", "C", "D"]:
                            seats_to_add.append(
                                FerrySeat(
                                    schedule_id=sched.id,
                                    seat_number=f"E{row}{col}",
                                    cabin_class="ECONOMY",
                                    price_inr=1200.00,
                                    is_booked=False,
                                )
                            )

                    for row in range(1, 5):
                        for col in ["A", "B", "C", "D"]:
                            seats_to_add.append(
                                FerrySeat(
                                    schedule_id=sched.id,
                                    seat_number=f"D{row}{col}",
                                    cabin_class="DELUXE",
                                    price_inr=1600.00,
                                    is_booked=False,
                                )
                            )

                    for row in range(1, 3):
                        for col in ["A", "B", "C", "D"]:
                            seats_to_add.append(
                                FerrySeat(
                                    schedule_id=sched.id,
                                    seat_number=f"R{row}{col}",
                                    cabin_class="ROYAL",
                                    price_inr=2500.00,
                                    is_booked=False,
                                )
                            )

                    db.add_all(seats_to_add)
                    await db.commit()

        print("Ferry vessels, schedules, and 2D cabin seat maps successfully seeded!")


if __name__ == "__main__":
    asyncio.run(seed_ferry_data())

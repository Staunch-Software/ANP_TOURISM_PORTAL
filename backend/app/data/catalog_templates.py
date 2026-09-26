"""
Single source of truth for the recurring attraction/ferry availability
templates. Both the one-time seed scripts (seed_catalog.py, seed_ferries.py)
and the rolling-window availability service (app/services/availability_service.py)
read from here, so the two can never drift out of sync with each other.
"""
from datetime import time

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

VESSELS_DATA = [
    {"name": "MV Makruzz Diamond", "operator": "Makruzz Catamarans", "capacity": 120},
    {"name": "Green Ocean 1", "operator": "Green Ocean Lines", "capacity": 100},
]

ROUTE_TEMPLATES = [
    {"vessel": "MV Makruzz Diamond", "src": "PORT_BLAIR", "dst": "HAVELOCK", "dep_time": time(8, 0)},
    {"vessel": "MV Makruzz Diamond", "src": "HAVELOCK", "dst": "NEIL", "dep_time": time(11, 30)},
    {"vessel": "Green Ocean 1", "src": "PORT_BLAIR", "dst": "HAVELOCK", "dep_time": time(9, 30)},
    {"vessel": "Green Ocean 1", "src": "NEIL", "dst": "PORT_BLAIR", "dep_time": time(16, 0)},
]

# 2D cabin seat map shared by every ferry schedule -- (prefix, row_count, price)
FERRY_CABIN_TEMPLATE = [
    ("E", "ECONOMY", 6, 1200.00),
    ("D", "DELUXE", 4, 1600.00),
    ("R", "ROYAL", 2, 2500.00),
]
FERRY_SEAT_COLUMNS = ["A", "B", "C", "D"]

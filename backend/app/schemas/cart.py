from typing import List

from pydantic import BaseModel


class PassengerDetail(BaseModel):
    name: str
    age: int
    gender: str = "MALE"  # MALE, FEMALE, OTHER
    id_type: str = "AADHAAR"  # AADHAAR, PASSPORT, VOTER_ID
    id_number: str


class AddAttractionToCartRequest(BaseModel):
    slot_id: str
    nationality: str = "INDIAN"  # INDIAN, FOREIGN
    passenger: PassengerDetail


class AddFerryToCartRequest(BaseModel):
    schedule_id: str
    seat_number: str
    passenger: PassengerDetail


class CartItemResponse(BaseModel):
    cart_item_id: str
    item_type: str
    title: str
    slot_or_seat: str
    price: float
    passenger_name: str
    id_type: str
    id_number: str


class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    gross_amount: float
    gst_tax_amount: float
    net_payable: float
    expires_in_seconds: int


class CheckoutResponse(BaseModel):
    order_id: str
    order_ref: str
    status: str
    gross_amount: float
    tax_amount: float
    net_payable: float
    items_count: int
    message: str

from typing import List, Optional

from pydantic import BaseModel


class GroupRosterMember(BaseModel):
    full_name: str
    age: int
    gender: str  # MALE, FEMALE, OTHER
    nationality: str  # INDIAN, FOREIGN
    id_type: str  # AADHAAR, PASSPORT, VOTER_ID
    id_number: str


class GroupBookingRequestCreate(BaseModel):
    organization_name: str
    organization_type: str  # SCHOOL, COLLEGE, CORPORATE, TOUR_OPERATOR, GOVT_DELEGATION
    contact_person: str
    contact_phone: str
    contact_email: str
    attraction_slot_id: str
    indian_travelers_count: int
    foreign_travelers_count: int
    roster: List[GroupRosterMember]


class GroupBookingSummary(BaseModel):
    id: str
    request_ref: str
    organization_name: str
    organization_type: str
    contact_person: str
    contact_phone: str
    contact_email: str
    attraction_title: str
    slot_date: str
    start_time: str
    end_time: str
    indian_travelers_count: int
    foreign_travelers_count: int
    total_headcount: int
    status: str
    admin_notes: Optional[str] = None
    order_ref: Optional[str] = None
    created_at: str
    roster: List[GroupRosterMember]


class GroupBookingDecisionRequest(BaseModel):
    reason: Optional[str] = None

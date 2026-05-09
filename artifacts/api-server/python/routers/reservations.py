from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Reservation, User
from schemas import ReservationCreate, ReservationUpdate, ReservationOut
from auth import get_current_user, get_admin_user

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


@router.get("", response_model=list[ReservationOut])
def list_reservations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.is_admin:
        rows = (
            db.query(Reservation, User.name, User.email)
            .join(User, Reservation.user_id == User.id)
            .order_by(Reservation.date.desc(), Reservation.created_at.desc())
            .all()
        )
        result = []
        for r, name, email in rows:
            out = ReservationOut.model_validate(r)
            out.user_name = name
            out.user_email = email
            result.append(out)
        return result
    else:
        rows = db.query(Reservation).filter(
            Reservation.user_id == user.id
        ).order_by(Reservation.date.desc()).all()
        return [ReservationOut.model_validate(r) for r in rows]


@router.post("", response_model=ReservationOut, status_code=201)
def create_reservation(
    body: ReservationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    reservation = Reservation(
        user_id=user.id,
        date=body.date,
        time_slot=body.time_slot,
        service_type=body.service_type,
        vehicle_model=body.vehicle_model,
        vehicle_number=body.vehicle_number,
        notes=body.notes,
        status="pending",
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return ReservationOut.model_validate(reservation)


@router.put("/{reservation_id}", response_model=ReservationOut)
def update_reservation(
    reservation_id: int,
    body: ReservationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
    if not user.is_admin and r.user_id != user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    for field, val in body.model_dump(exclude_none=True).items():
        setattr(r, field, val)
    db.commit()
    db.refresh(r)
    return ReservationOut.model_validate(r)


@router.delete("/{reservation_id}", status_code=204)
def delete_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
    if not user.is_admin and r.user_id != user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    db.delete(r)
    db.commit()

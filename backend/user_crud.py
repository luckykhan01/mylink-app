from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from models import User, UserRole
from schemas import UserCreate, UserUpdate
from auth import get_password_hash, verify_password

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_users(
    db: Session, 
    skip: int = 0, 
    limit: int = 10,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None
) -> tuple[List[User], int]:
    query = db.query(User)
    
    # Фильтр по роли
    if role:
        query = query.filter(User.role == role)
    
    # Фильтр по активности
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Получаем общее количество
    total = query.count()
    
    # Применяем пагинацию
    users = query.offset(skip).limit(limit).all()
    
    return users, total

def create_user(db: Session, user: UserCreate) -> User:
    # Проверяем, что пользователь с таким email не существует
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise ValueError("Пользователь с таким email уже существует")
    
    # Хешируем пароль
    hashed_password = get_password_hash(user.password)
    
    # Создаем пользователя
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user.dict(exclude_unset=True)
    
    # Если обновляется пароль, хешируем его
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Аутентификация пользователя"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from database import Base

class UserRole(str, enum.Enum):
    EMPLOYER = "employer"  # Работодатель
    JOB_SEEKER = "job_seeker"  # Соискатель

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    vacancies = relationship("Vacancy", back_populates="employer")
    applications = relationship("JobApplication", back_populates="job_seeker")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"

class Vacancy(Base):
    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    company = Column(String(100), nullable=False, index=True)
    location = Column(String(100), nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    currency = Column(String(10), default="RUB")
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    employment_type = Column(String(50), nullable=True)  # full-time, part-time, contract, etc.
    experience_level = Column(String(50), nullable=True)  # junior, middle, senior, lead
    remote_work = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связь с работодателем
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    employer = relationship("User", back_populates="vacancies")
    
    # Связи с заявками
    applications = relationship("JobApplication", back_populates="vacancy")

    def __repr__(self):
        return f"<Vacancy(id={self.id}, title='{self.title}', company='{self.company}')>"

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    cover_letter = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, reviewed, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    job_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_seeker = relationship("User", back_populates="applications")
    
    vacancy_id = Column(Integer, ForeignKey("vacancies.id"), nullable=False)
    vacancy = relationship("Vacancy", back_populates="applications")

    def __repr__(self):
        return f"<JobApplication(id={self.id}, status='{self.status}')>"

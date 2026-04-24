from sqlalchemy import Column, String, Float, Boolean, Date, DateTime, ForeignKey, JSON, Text, DECIMAL, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Farm(Base):
    __tablename__ = "farms"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    district = Column(String(100))
    latitude = Column(DECIMAL)
    longitude = Column(DECIMAL)
    irrigation_type = Column(String(50))

class Crop(Base):
    __tablename__ = "crops"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(100), unique=True)
    local_name = Column(String(100))
    season = Column(String(50))
    crop_type = Column(String(50))
    duration_days = Column(DECIMAL)
    is_legume = Column(Boolean, default=False)

class Source(Base):
    __tablename__ = "sources"
    id = Column(UUID(as_uuid=True), primary_key=True)
    title = Column(String(500))
    url = Column(Text)
    institution = Column(String(100))
    publication_year = Column(DECIMAL)
    source_type = Column(String(50))

class STCREquation(Base):
    __tablename__ = "stcr_equations"
    id = Column(UUID(as_uuid=True), primary_key=True)
    crop_id = Column(UUID(as_uuid=True), ForeignKey("crops.id"))
    region = Column(String(100))
    soil_type = Column(String(50))
    nutrient = Column(String(2))
    x_coeff = Column(DECIMAL)
    y_coeff = Column(DECIMAL)
    z_coeff = Column(DECIMAL)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"))

class FertilizerProduct(Base):
    __tablename__ = "fertilizer_products"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    product_code = Column(String(50))
    n_pct = Column(DECIMAL, default=0)
    p2o5_pct = Column(DECIMAL, default=0)
    k2o_pct = Column(DECIMAL, default=0)
    zn_pct = Column(DECIMAL, default=0)
    s_pct = Column(DECIMAL, default=0)
    ca_pct = Column(DECIMAL, default=0)
    is_organic = Column(Boolean, default=False)
    product_type = Column(String(50))
    unit_weight_kg = Column(DECIMAL)
    price_per_bag_inr = Column(DECIMAL)
    govt_subsidized = Column(Boolean, default=False)
    common_brands = Column(JSON)

class Dealer(Base):
    __tablename__ = "dealers"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    dealer_type = Column(String(50))
    address = Column(Text)
    district = Column(String(100))
    phone = Column(String(20))
    whatsapp = Column(String(20))
    url = Column(Text)
    products_available = Column(JSON)
    is_govt_center = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    latitude = Column(DECIMAL)
    longitude = Column(DECIMAL)

class ValidationCase(Base):
    __tablename__ = "validation_cases"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    crop_name = Column(String(100))
    region = Column(String(100))
    source_reference = Column(Text)
    input_data = Column(JSON)
    expected_n_kg_ha = Column(DECIMAL)
    expected_p_kg_ha = Column(DECIMAL)
    expected_k_kg_ha = Column(DECIMAL)
    expected_amendments = Column(JSON)
    tolerance_pct = Column(DECIMAL)
    case_type = Column(String(50))

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(UUID(as_uuid=True), primary_key=True)
    soil_sample_id = Column(UUID(as_uuid=True))
    n_required_kg_ha = Column(DECIMAL)
    p_required_kg_ha = Column(DECIMAL)
    k_required_kg_ha = Column(DECIMAL)
    products = Column(JSON)
    confidence_score = Column(DECIMAL)
    rag_sources = Column(JSON)
    explanation = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class MarketPriceCache(Base):
    """
    Region-wise commodity price cache.
    Slot: 'morning' (06:00–17:59 IST) | 'evening' (18:00–05:59 IST next day)
    Only two fetches per region per day are ever made.
    """
    __tablename__ = "market_price_cache"
    __table_args__ = (
        UniqueConstraint("region_key", "slot", "slot_date", name="uq_market_cache_slot"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True)
    region_key = Column(String(120), nullable=False, index=True)   # normalised region slug
    region_label = Column(String(255))                              # display label
    slot = Column(String(10), nullable=False)                       # 'morning' | 'evening'
    slot_date = Column(Date, nullable=False)                        # IST calendar date
    data = Column(JSON, nullable=False)                             # full response dict
    source = Column(String(100))
    fetched_at = Column(DateTime, server_default=func.now())


class CommunityPost(Base):
    __tablename__ = "community_posts"
    id = Column(UUID(as_uuid=True), primary_key=True)
    author_name = Column(String(255), nullable=False)
    author_role = Column(String(255))
    author_img = Column(Text)
    content = Column(Text, nullable=False)
    likes = Column(Float, default=0)
    comments = Column(Float, default=0)
    post_type = Column(String(50)) # 'discussion' | 'expert' | 'success'
    created_at = Column(DateTime, server_default=func.now())

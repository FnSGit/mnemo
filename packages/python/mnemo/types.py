"""Mnemo data types."""

from typing import Literal, Optional
from pydantic import BaseModel, Field

MemoryCategory = Literal[
    "preference", "fact", "decision", "entity", "other", "reflection"
]


class Memory(BaseModel):
    """A single memory result from recall."""
    text: str
    score: float
    category: str
    importance: float
    timestamp: Optional[int] = None


class RecallResult(BaseModel):
    """Result from a recall operation."""
    results: list[Memory]

    @property
    def memories(self) -> list[Memory]:
        return self.results

    def __iter__(self):
        return iter(self.results)

    def __len__(self):
        return len(self.results)

    def __getitem__(self, idx):
        return self.results[idx]


class StoreResult(BaseModel):
    """Result from a store operation."""
    id: str


class Stats(BaseModel):
    """Memory store statistics."""
    totalEntries: int = Field(alias="totalEntries")
    scopeCounts: dict[str, int] = Field(alias="scopeCounts", default_factory=dict)
    categoryCounts: dict[str, int] = Field(alias="categoryCounts", default_factory=dict)

    model_config = {"populate_by_name": True}


class HealthStatus(BaseModel):
    """Server health check result."""
    status: str
    version: str

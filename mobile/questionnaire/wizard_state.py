from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class WizardState:
    """
    Pure-Python wizard state machine (testable, no Kivy dependency).
    """

    questions: List[Dict[str, Any]] = field(default_factory=list)
    index: int = 0
    started: bool = False

    def start(self, questions: List[Dict[str, Any]]) -> None:
        self.questions = list(questions)
        self.index = 0
        self.started = True

    def stop(self) -> None:
        self.started = False
        self.index = 0

    def total(self) -> int:
        return len(self.questions)

    def current(self) -> Optional[Dict[str, Any]]:
        if not self.started or not self.questions:
            return None
        if 0 <= self.index < len(self.questions):
            return self.questions[self.index]
        return None

    def is_first(self) -> bool:
        return self.index <= 0

    def is_last(self) -> bool:
        return self.questions and self.index >= len(self.questions) - 1

    def next(self) -> bool:
        if not self.questions:
            return False
        if self.index < len(self.questions) - 1:
            self.index += 1
            return True
        return False

    def prev(self) -> bool:
        if not self.questions:
            return False
        if self.index > 0:
            self.index -= 1
            return True
        return False


#!/usr/bin/env python3
"""Generate the branded U.S. and Canada MMIPS fillable family-record PDFs."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "forms"
LOGO_PATH = ROOT / "public" / "mmips-hand-icon-192.png"
PAGE_WIDTH, PAGE_HEIGHT = letter

RED = HexColor("#B9372B")
GOLD = HexColor("#9A6B13")
INK = HexColor("#171411")
MUTED = HexColor("#5E5146")
LINE = HexColor("#B9A998")
PALE_GOLD = HexColor("#FFF5E3")
PRIVATE_BG = HexColor("#FFF0ED")


@dataclass(frozen=True)
class CountryCopy:
    code: str
    country: str
    agency_label: str
    file_label: str
    tribal_label: str
    reference_label: str
    site: str
    filename: str


COUNTRIES = (
    CountryCopy(
        code="us",
        country="United States",
        agency_label="Tribal, local, state, or federal agency",
        file_label="Agency case or file number",
        tribal_label="Tribal or victim-services contact (optional)",
        reference_label="NCIC confirmation, NamUs number, or other official reference",
        site="us.mmips.com/resources",
        filename="mmips-us-family-record.pdf",
    ),
    CountryCopy(
        code="ca",
        country="Canada",
        agency_label="Police service",
        file_label="Police file number",
        tribal_label="First Nation, Inuit, M\u00e9tis, or victim-services contact (optional)",
        reference_label="Other official reference number or link",
        site="ca.mmips.com/resources",
        filename="mmips-canada-family-record.pdf",
    ),
)


def draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float, font: str = "Helvetica", size: float = 8.5, leading: float = 11, color: Color = INK) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line = ""
    lines: list[str] = []
    for word in words:
        candidate = f"{line} {word}".strip()
        if c.stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    for item in lines:
        c.drawString(x, y, item)
        y -= leading
    return y


def header(c: canvas.Canvas, copy: CountryCopy, page_number: int) -> float:
    c.setFillColor(white)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    c.drawImage(ImageReader(str(LOGO_PATH)), 36, PAGE_HEIGHT - 75, width=42, height=42, preserveAspectRatio=True, mask="auto")
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(88, PAGE_HEIGHT - 44, f"MMIPS {copy.country.upper()}")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(88, PAGE_HEIGHT - 65, "Family record")
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED)
    c.drawRightString(PAGE_WIDTH - 36, PAGE_HEIGHT - 48, f"Page {page_number} of 2")
    c.setStrokeColor(RED)
    c.setLineWidth(2)
    c.line(36, PAGE_HEIGHT - 84, PAGE_WIDTH - 36, PAGE_HEIGHT - 84)
    return PAGE_HEIGHT - 100


def footer(c: canvas.Canvas, copy: CountryCopy) -> None:
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(36, 30, PAGE_WIDTH - 36, 30)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(36, 18, "MMIPS is not law enforcement or an emergency service. Do not send investigative tips to MMIPS.")
    c.drawRightString(PAGE_WIDTH - 36, 18, copy.site)


def section_title(c: canvas.Canvas, number: int, title: str, y: float) -> float:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(36, y, f"{number}. {title}")
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(36, y - 5, PAGE_WIDTH - 36, y - 5)
    return y - 18


def text_field(c: canvas.Canvas, copy: CountryCopy, name: str, label: str, x: float, y: float, width: float, height: float = 22, help_text: str | None = None, multiline: bool = False, private: bool = False) -> float:
    c.setFillColor(RED if private else INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x, y, label)
    field_y = y - height - 4
    flags = 4096 if multiline else 0
    c.acroForm.textfield(
        name=f"{copy.code}_{name}",
        tooltip=label,
        x=x,
        y=field_y,
        width=width,
        height=height,
        borderWidth=1,
        borderColor=RED if private else LINE,
        fillColor=PRIVATE_BG if private else white,
        textColor=INK,
        forceBorder=True,
        fontName="Helvetica",
        fontSize=9,
        fieldFlags=flags,
    )
    next_y = field_y - 5
    if help_text:
        next_y = draw_wrapped(c, help_text, x, next_y, width, size=7, leading=8.5, color=MUTED)
    return next_y - 5


def draw_page_one(c: canvas.Canvas, copy: CountryCopy) -> None:
    y = header(c, copy, 1)
    c.setFillColor(PALE_GOLD)
    c.roundRect(36, y - 65, PAGE_WIDTH - 72, 60, 7, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(48, y - 20, "This copy stays with you")
    draw_wrapped(c, "Use only what helps and leave anything blank. Keep the completed record private. Nothing in this PDF is sent to MMIPS. In immediate danger, call 911; you do not need to finish this first.", 48, y - 34, PAGE_WIDTH - 96, size=8, leading=10)
    y -= 82

    y = section_title(c, 1, "Person and report", y)
    gap = 12
    col = (PAGE_WIDTH - 72 - gap) / 2
    left = 36
    right = left + col + gap
    row_y = y
    next_left = text_field(c, copy, "person_name", "Person's full name", left, row_y, col)
    next_right = text_field(c, copy, "used_name", "Name they use and pronouns (optional)", right, row_y, col)
    row_y = min(next_left, next_right)
    next_left = text_field(c, copy, "concern_date", "Date and time the concern began", left, row_y, col)
    next_right = text_field(c, copy, "report_date", "Date and time first reported", right, row_y, col)
    row_y = min(next_left, next_right)
    next_left = text_field(c, copy, "agency", copy.agency_label, left, row_y, col)
    next_right = text_field(c, copy, "file_number", copy.file_label, right, row_y, col)
    row_y = min(next_left, next_right)
    next_left = text_field(c, copy, "investigator", "Investigator or family liaison", left, row_y, col)
    next_right = text_field(c, copy, "investigator_contact", "Official phone or email", right, row_y, col)
    row_y = min(next_left, next_right)
    next_left = text_field(c, copy, "tribal_contact", copy.tribal_label, left, row_y, col)
    next_right = text_field(c, copy, "other_reference", copy.reference_label, right, row_y, col)
    y = min(next_left, next_right) - 1

    y = section_title(c, 2, "Location and basic information", y)
    y = text_field(c, copy, "public_area", "Broad last-known area that may be safe to share publicly", 36, y, PAGE_WIDTH - 72, height=34, help_text="Use a community or region, not a private street address.", multiline=True)
    y = text_field(c, copy, "private_location", "Exact or sensitive location for your private record", 36, y, PAGE_WIDTH - 72, height=34, help_text="Keep this off public posts. Share only with the investigating agency or another trusted service when appropriate.", multiline=True, private=True)
    next_left = text_field(c, copy, "description", "Basic identifying information requested by the agency", left, y, col, height=40, multiline=True)
    next_right = text_field(c, copy, "clothing_vehicle", "Clothing, vehicle, travel, or mobility details", right, y, col, height=40, multiline=True)
    y = min(next_left, next_right)
    footer(c, copy)
    c.showPage()


def draw_contact_row(c: canvas.Canvas, copy: CountryCopy, row: int, y: float) -> float:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(36, y, f"Contact {row}")
    y -= 12
    gap = 8
    date_w = 105
    person_w = 155
    notes_w = PAGE_WIDTH - 72 - date_w - person_w - (gap * 2)
    text_field(c, copy, f"contact_{row}_date", "Date and time", 36, y, date_w, height=28)
    text_field(c, copy, f"contact_{row}_person", "Person, agency, and contact", 36 + date_w + gap, y, person_w, height=28)
    next_y = text_field(c, copy, f"contact_{row}_notes", "What happened and next step", 36 + date_w + gap + person_w + gap, y, notes_w, height=28, multiline=True)
    return next_y - 2


def draw_page_two(c: canvas.Canvas, copy: CountryCopy) -> None:
    y = header(c, copy, 2)
    y = section_title(c, 3, "Calls and updates", y)
    y = draw_wrapped(c, "Short notes are enough. Write the next step so you do not have to hold it in memory.", 36, y, PAGE_WIDTH - 72, size=8, leading=10, color=MUTED) - 4
    for row in range(1, 5):
        y = draw_contact_row(c, copy, row, y)

    y = section_title(c, 4, "Information approved for public sharing", y)
    gap = 12
    col = (PAGE_WIDTH - 72 - gap) / 2
    left = 36
    right = left + col + gap
    next_left = text_field(c, copy, "photos", "Recent photos approved for public use", left, y, col, height=36, help_text="Record filenames or where approved copies are kept.", multiline=True)
    next_right = text_field(c, copy, "tip_contact", "Official public tip contact", right, y, col, height=36, help_text="Use only the contact confirmed by the agency.", multiline=True)
    y = min(next_left, next_right)
    next_left = text_field(c, copy, "safe_public_facts", "Facts the family and agency say are safe to publish", left, y, col, height=40, multiline=True)
    next_right = text_field(c, copy, "keep_private", "Information that must stay private", right, y, col, height=40, help_text="Examples: addresses, shelters, witnesses, health details, or exact sensitive locations.", multiline=True, private=True)
    y = min(next_left, next_right)

    y = section_title(c, 5, "Questions and next steps", y)
    y = text_field(c, copy, "next_steps", "What needs to happen next, who will do it, and when to check again", 36, y, PAGE_WIDTH - 72, height=38, multiline=True)
    text_field(c, copy, "support", "Trusted support person or service (optional)", 36, y, PAGE_WIDTH - 72, height=32, help_text="Someone who can sit with you, make calls with permission, take notes, or help you rest.", multiline=True)
    footer(c, copy)
    c.showPage()


def validate_pdf(path: Path, copy: CountryCopy) -> None:
    reader = PdfReader(path)
    if len(reader.pages) != 2:
        raise RuntimeError(f"{path.name}: expected 2 pages")
    fields = reader.get_fields() or {}
    expected = {
        f"{copy.code}_{name}"
        for name in (
            "person_name", "used_name", "concern_date", "report_date", "agency", "file_number",
            "investigator", "investigator_contact", "tribal_contact", "other_reference", "public_area",
            "private_location", "description", "clothing_vehicle", "photos", "tip_contact",
            "safe_public_facts", "keep_private", "next_steps", "support",
        )
    }
    expected.update(f"{copy.code}_contact_{row}_{suffix}" for row in range(1, 5) for suffix in ("date", "person", "notes"))
    missing = expected - set(fields)
    if missing:
        raise RuntimeError(f"{path.name}: missing fields {sorted(missing)}")
    if len(fields) != len(expected):
        raise RuntimeError(f"{path.name}: expected {len(expected)} canonical fields, found {len(fields)}")
    for name in expected:
        value = fields[name].get("/V", "")
        if value not in ("", None):
            raise RuntimeError(f"{path.name}: expected blank canonical value for {name}")
    widgets = 0
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            widget = annotation.get_object()
            if widget.get("/Subtype") == "/Widget":
                widgets += 1
                parent = widget.get("/Parent")
                parent_object = parent.get_object() if parent else None
                field_name = widget.get("/T") or (parent_object.get("/T") if parent_object else None)
                effective_value = widget.get("/V") or (parent_object.get("/V") if parent_object else "")
                if str(field_name) not in expected:
                    raise RuntimeError(f"{path.name}: unexpected widget field {field_name}")
                if effective_value not in ("", None):
                    raise RuntimeError(f"{path.name}: expected blank widget value for {field_name}")
                appearance = widget.get("/AP")
                if not appearance or not appearance.get("/N"):
                    raise RuntimeError(f"{path.name}: widget is missing a normal appearance")
    if widgets != len(expected):
        raise RuntimeError(f"{path.name}: expected {len(expected)} widgets, found {widgets}")

    sample_field = f"{copy.code}_person_name"
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.update_page_form_field_values(None, {sample_field: "SAMPLE FILLABILITY CHECK"}, auto_regenerate=False)
    filled_buffer = BytesIO()
    writer.write(filled_buffer)
    filled_buffer.seek(0)
    filled_reader = PdfReader(filled_buffer)
    filled_fields = filled_reader.get_fields() or {}
    if filled_fields.get(sample_field, {}).get("/V") != "SAMPLE FILLABILITY CHECK":
        raise RuntimeError(f"{path.name}: canonical field did not retain a test value")
    matching_widgets = []
    for page in filled_reader.pages:
        for annotation in page.get("/Annots", []):
            widget = annotation.get_object()
            parent = widget.get("/Parent")
            parent_object = parent.get_object() if parent else None
            field_name = widget.get("/T") or (parent_object.get("/T") if parent_object else None)
            if str(field_name) == sample_field:
                matching_widgets.append((widget, parent_object))
    if len(matching_widgets) != 1:
        raise RuntimeError(f"{path.name}: expected one widget for the test-filled field")
    filled_widget, filled_parent = matching_widgets[0]
    effective_value = filled_widget.get("/V") or (filled_parent.get("/V") if filled_parent else None)
    if effective_value != "SAMPLE FILLABILITY CHECK":
        raise RuntimeError(f"{path.name}: widget did not inherit the test value")
    if not filled_widget.get("/AP") or not filled_widget.get("/AP").get("/N"):
        raise RuntimeError(f"{path.name}: test-filled widget lost its normal appearance")


def generate(copy: CountryCopy) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / copy.filename
    c = canvas.Canvas(str(path), pagesize=letter, pageCompression=1)
    c.setTitle(f"MMIPS {copy.country} Family Record")
    c.setAuthor("MMIPS")
    c.setSubject("Private, fillable family record for offline use")
    draw_page_one(c, copy)
    draw_page_two(c, copy)
    c.save()
    validate_pdf(path, copy)
    return path


if __name__ == "__main__":
    for country in COUNTRIES:
        print(generate(country))

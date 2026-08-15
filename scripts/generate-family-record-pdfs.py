#!/usr/bin/env python3
"""Generate comprehensive branded U.S. and Canada MMIPS family workbooks."""

from __future__ import annotations

from dataclasses import dataclass, field
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "forms"
LOGO_PATH = ROOT / "public" / "mmips-hand-icon-192.png"
PAGE_WIDTH, PAGE_HEIGHT = letter
TOTAL_PAGES = 11
LEFT = 36
RIGHT = PAGE_WIDTH - 36
CONTENT_WIDTH = RIGHT - LEFT

RED = HexColor("#B9372B")
GOLD = HexColor("#9A6B13")
INK = HexColor("#171411")
MUTED = HexColor("#5E5146")
LINE = HexColor("#A99887")
PALE_GOLD = HexColor("#FFF5E3")
PRIVATE_BG = HexColor("#FFF0ED")


@dataclass(frozen=True)
class CountryCopy:
    code: str
    country: str
    community_label: str
    agency_label: str
    site: str
    filename: str
    agency_items: tuple[str, ...]
    agency_note: str
    investigator_questions: tuple[str, ...]
    source_lines: tuple[str, ...]


COUNTRIES = (
    CountryCopy(
        code="us",
        country="United States",
        community_label="Tribal Nation, Alaska Native, Native Hawaiian, or community affiliation (optional)",
        agency_label="Tribal, local, state, territorial, or federal agency receiving the report",
        site="us.mmips.com/resources",
        filename="mmips-us-family-record.pdf",
        agency_items=(
            "911, when there is immediate danger",
            "Local, Tribal, or territorial law-enforcement agency",
            "Lead investigator or family liaison",
            "BIA Missing and Murdered Unit, when the case or jurisdiction may apply",
            "FBI or another federal agency, when directed or jurisdiction may apply",
            "State or territory missing-person clearinghouse",
            "NamUs after a police report is filed; ask about agency or family entry",
            "NCMEC after law enforcement if the missing person is under 18",
            "Victim services, Tribal family support, coroner, or medical examiner, when applicable",
        ),
        agency_note="BIA MMU: 1-833-560-2065 / OJS_MMU@bia.gov. NCMEC under 18, after law enforcement: 1-800-THE-LOST.",
        investigator_questions=(
            "Was the person entered into NCIC?",
            "Which agency and investigator lead the case?",
            "What urgent risks and search actions are documented?",
            "Who is the family liaison and when is the next update?",
            "Should the case be entered in NamUs?",
            "Should BIA MMU, FBI, NCMEC, or another agency be involved?",
            "Are dental records, fingerprints, DNA, medical records, or device records needed?",
            "What information and photo may be released publicly?",
        ),
        source_lines=(
            "Official references: bia.gov/service/mmu; namus.nij.ojp.gov/services and /frequently-asked-questions",
            "For a missing child: ncmec.org/gethelpnow/isyourchildmissing",
        ),
    ),
    CountryCopy(
        code="ca",
        country="Canada",
        community_label="First Nation, Inuit, M\u00e9tis, or community affiliation (optional)",
        agency_label="Police service receiving the report",
        site="ca.mmips.com/resources",
        filename="mmips-canada-family-record.pdf",
        agency_items=(
            "911 or local emergency number, when there is immediate danger",
            "Police service of jurisdiction or local RCMP detachment",
            "First Nation, Inuit, or Indigenous police service, when applicable",
            "Lead investigator or designated family liaison officer",
            "Provincial or territorial missing-persons unit / NCMPUR through police",
            "Victim services or Indigenous relations / liaison officer",
            "Family Information Liaison Unit for a missing or murdered Indigenous loved one",
            "Coroner or medical examiner contact, when applicable",
        ),
        agency_note="Any police station can take a report. The police service where the person was last seen generally conducts the investigation.",
        investigator_questions=(
            "Was the person entered into CPIC?",
            "Which police service and investigator lead the case?",
            "What urgent risks and search actions are documented?",
            "Who is the family liaison and when is the next update?",
            "Should NCMPUR or the National Missing Persons DNA Program be involved?",
            "Are dental records, fingerprints, DNA, medical records, or device records needed?",
            "Can a Family Information Liaison Unit or victim service help?",
            "What information and photo may be released publicly?",
        ),
        source_lines=(
            "Official reference: rcmp.ca/en/corporate-information/publications-and-manuals/information-families-missing-persons",
            "Family Information Liaison Units: justice.canada.ca/eng/fund-fina/cj-jp/fund-fond/mmiw-fada/info.html",
        ),
    ),
)

IMMEDIATE_STEPS = (
    "Call 911 if there is immediate danger or urgent risk.",
    "Report the person missing as soon as you are concerned. Do not wait to complete this workbook.",
    "Ask for the case or file number and the lead investigator or family liaison.",
    "Tell the investigator about urgent health, medication, disability, weather, terrain, violence, or exploitation risks.",
    "Ask what information and which photograph are safe to release publicly.",
)

RISK_TOPICS = (
    "Urgent medical, medication, mental-health, disability, cognitive, or mobility needs",
    "Recent trauma, unusual behaviour, distress, or reason this is out of character",
    "Relationship violence, stalking, coercion, trafficking, exploitation, or another threat",
    "Housing instability, remote terrain, severe weather, inadequate clothing, or transportation risk",
    "Substance-use information that may help assess immediate safety or likely locations",
    "Access to weapons or another immediate danger",
    "Prior disappearances and where the person was previously located",
    "Other private information that may help investigators assess risk and locate the person",
)

PHOTO_ITEMS = (
    "Recent clear face photo showing current hairstyle and appearance",
    "Recent full-body photo",
    "Side or profile photo, if available",
    "Photos showing tattoos, scars, birthmarks, piercings, or other identifying features",
    "Photo of usual glasses, jewellery, mobility aid, or another recognizable item",
    "Photo of vehicle, bicycle, or other regular transportation",
    "Original or highest-resolution files, not screenshots when originals exist",
    "A family-approved image that respects how the person would want to be represented",
)

RECORD_ITEMS = (
    "Government identification; correct legal name, birth date, and aliases",
    "Dentist / orthodontist contact; ask about dental records and X-rays",
    "Doctor, clinic, pharmacy, urgent medical needs, and current medications",
    "Possible fingerprint source: employment, military, immigration, licensing, or prior records",
    "Phone numbers, device type, carrier, email addresses, and social-media usernames",
    "Vehicle registration, plate, make, model, year, colour, damage, and stickers",
    "Work, school, travel, transportation, and regular-location information",
    "Existing reports, official reference numbers, approved posters, and public tip contacts",
)


def wrap_lines(c: canvas.Canvas, text: str, width: float, font: str, size: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if c.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float, font: str = "Helvetica", size: float = 8.2, leading: float = 10.2, color: Color = INK) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_lines(c, text, width, font, size):
        c.drawString(x, y, line)
        y -= leading
    return y


@dataclass
class FormContext:
    c: canvas.Canvas
    copy: CountryCopy
    expected: set[str] = field(default_factory=set)
    checkboxes: set[str] = field(default_factory=set)

    def field_name(self, name: str) -> str:
        return f"{self.copy.code}_{name}"

    def text_field(self, name: str, label: str, x: float, y: float, width: float, height: float = 24, help_text: str | None = None, multiline: bool = False, private: bool = False) -> float:
        full_name = self.field_name(name)
        if full_name in self.expected:
            raise RuntimeError(f"duplicate field {full_name}")
        self.expected.add(full_name)
        label_lines = wrap_lines(self.c, label, width, "Helvetica-Bold", 7.6)
        self.c.setFillColor(RED if private else INK)
        self.c.setFont("Helvetica-Bold", 7.6)
        label_y = y
        for line in label_lines:
            self.c.drawString(x, label_y, line)
            label_y -= 8.8
        field_y = label_y - height - 2
        self.c.acroForm.textfield(
            name=full_name,
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
            fontSize=8.5,
            fieldFlags=4096 if multiline else 0,
        )
        next_y = field_y - 5
        if help_text:
            next_y = draw_wrapped(self.c, help_text, x, next_y, width, size=6.6, leading=7.8, color=MUTED)
        return next_y - 4

    def checkbox(self, name: str, label: str, x: float, y: float, width: float, private: bool = False) -> float:
        full_name = self.field_name(name)
        if full_name in self.expected:
            raise RuntimeError(f"duplicate field {full_name}")
        self.expected.add(full_name)
        self.checkboxes.add(full_name)
        size = 11
        lines = wrap_lines(self.c, label, width - size - 7, "Helvetica", 7.6)
        row_height = max(18, len(lines) * 9 + 4)
        check_y = y - size + 1
        self.c.acroForm.checkbox(
            name=full_name,
            tooltip=label,
            x=x,
            y=check_y,
            size=size,
            checked=False,
            buttonStyle="check",
            borderWidth=1,
            borderColor=RED if private else LINE,
            fillColor=PRIVATE_BG if private else white,
            textColor=RED,
            forceBorder=True,
        )
        self.c.setFont("Helvetica", 7.6)
        self.c.setFillColor(INK)
        text_y = y
        for line in lines:
            self.c.drawString(x + size + 7, text_y, line)
            text_y -= 9
        return y - row_height


def header(ctx: FormContext, page_number: int, section: str) -> float:
    c = ctx.c
    c.setFillColor(white)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    c.drawImage(ImageReader(str(LOGO_PATH)), LEFT, PAGE_HEIGHT - 67, width=36, height=36, preserveAspectRatio=True, mask="auto")
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(80, PAGE_HEIGHT - 39, f"MMIPS {ctx.copy.country.upper()}")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(80, PAGE_HEIGHT - 58, "Family investigator-preparation record")
    c.setFont("Helvetica", 7.4)
    c.setFillColor(MUTED)
    c.drawRightString(RIGHT, PAGE_HEIGHT - 40, f"Page {page_number} of {TOTAL_PAGES}")
    c.drawRightString(RIGHT, PAGE_HEIGHT - 54, section)
    c.setStrokeColor(RED)
    c.setLineWidth(2)
    c.line(LEFT, PAGE_HEIGHT - 76, RIGHT, PAGE_HEIGHT - 76)
    return PAGE_HEIGHT - 94


def footer(ctx: FormContext) -> None:
    c = ctx.c
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(LEFT, 30, RIGHT, 30)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.7)
    c.drawString(LEFT, 18, "Private family copy. MMIPS is not law enforcement. Do not send this completed workbook or investigative tips to MMIPS.")
    c.drawRightString(RIGHT, 18, ctx.copy.site)


def section_title(ctx: FormContext, title: str, y: float) -> float:
    ctx.c.setFillColor(INK)
    ctx.c.setFont("Helvetica-Bold", 12)
    ctx.c.drawString(LEFT, y, title)
    ctx.c.setStrokeColor(GOLD)
    ctx.c.setLineWidth(1)
    ctx.c.line(LEFT, y - 5, RIGHT, y - 5)
    return y - 18


def callout(ctx: FormContext, title: str, text: str, y: float, height: float, private: bool = False) -> float:
    c = ctx.c
    c.setFillColor(PRIVATE_BG if private else PALE_GOLD)
    c.roundRect(LEFT, y - height, CONTENT_WIDTH, height, 7, fill=1, stroke=0)
    c.setFillColor(RED if private else INK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(LEFT + 12, y - 17, title)
    draw_wrapped(c, text, LEFT + 12, y - 31, CONTENT_WIDTH - 24, size=7.5, leading=9.2)
    return y - height - 10


def checklist(ctx: FormContext, prefix: str, items: tuple[str, ...], y: float, private: bool = False) -> float:
    for index, item in enumerate(items, start=1):
        y = ctx.checkbox(f"{prefix}_{index}", item, LEFT + 8, y, CONTENT_WIDTH - 16, private=private)
    return y - 4


def two_fields(ctx: FormContext, left_spec: tuple[str, str], right_spec: tuple[str, str], y: float, height: float = 24, multiline: bool = False, private_left: bool = False, private_right: bool = False) -> float:
    gap = 12
    col = (CONTENT_WIDTH - gap) / 2
    left_y = ctx.text_field(left_spec[0], left_spec[1], LEFT, y, col, height=height, multiline=multiline, private=private_left)
    right_y = ctx.text_field(right_spec[0], right_spec[1], LEFT + col + gap, y, col, height=height, multiline=multiline, private=private_right)
    return min(left_y, right_y)


def three_fields(ctx: FormContext, specs: tuple[tuple[str, str], tuple[str, str], tuple[str, str]], y: float, height: float = 22, private: tuple[bool, bool, bool] = (False, False, False)) -> float:
    gap = 10
    col = (CONTENT_WIDTH - 2 * gap) / 3
    results = []
    for index, spec in enumerate(specs):
        results.append(ctx.text_field(spec[0], spec[1], LEFT + index * (col + gap), y, col, height=height, private=private[index]))
    return min(results)


def finish_page(ctx: FormContext) -> None:
    footer(ctx)
    ctx.c.showPage()


def page_one(ctx: FormContext) -> None:
    y = header(ctx, 1, "Start and primary contact")
    y = callout(ctx, "Start with safety - this workbook can wait", "Nothing written here is sent to MMIPS. Keep the completed workbook private and do not post it online. Call 911 for immediate danger. Report the person missing as soon as you are concerned; you do not need to finish this first, and you may leave anything blank.", y, 69)
    y = section_title(ctx, "1. First steps", y)
    y = checklist(ctx, "first_step", IMMEDIATE_STEPS, y)
    y = section_title(ctx, "Person and primary case contact", y)
    y = two_fields(ctx, ("person_name", "Full legal name"), ("used_name", "Chosen name, nickname, aliases, and pronouns"), y)
    y = two_fields(ctx, ("birth_date", "Birth date and current age"), ("community", ctx.copy.community_label), y)
    y = two_fields(ctx, ("reporter", "Person making this record and relationship"), ("reporter_contact", "Private callback number and email"), y, private_right=True)
    y = two_fields(ctx, ("report_date", "Date and time first reported"), ("agency", ctx.copy.agency_label), y)
    y = two_fields(ctx, ("file_number", "Case or file number"), ("investigator", "Lead investigator or family liaison"), y)
    two_fields(ctx, ("investigator_contact", "Direct official phone and email"), ("next_update", "Agreed date and time for the next update"), y)
    finish_page(ctx)


def page_two(ctx: FormContext) -> None:
    y = header(ctx, 2, "Physical description")
    y = section_title(ctx, "2. Complete physical description", y)
    y = draw_wrapped(ctx.c, "Use the person's current appearance. If you do not know, leave it blank. Investigators can help fill gaps.", LEFT, y, CONTENT_WIDTH, size=7.8, color=MUTED) - 8
    y = three_fields(ctx, (("height", "Height"), ("weight", "Weight"), ("build", "Build")), y)
    y = three_fields(ctx, (("hair", "Hair colour, length, and style"), ("eyes", "Eye colour"), ("skin", "Skin tone / complexion")), y)
    y = three_fields(ctx, (("facial_hair", "Facial hair"), ("glasses", "Glasses or contacts"), ("languages", "Languages / interpreter needs")), y)
    y = three_fields(ctx, (("assigned_sex", "Assigned sex at birth, if requested for identification"), ("gender", "Gender identity or expression"), ("appearance", "Self-described race, ethnicity, or appearance (optional)")), y, private=(True, True, True))
    y = ctx.text_field("tattoos", "Tattoos - design, words, colour, body location, and whether new or changed", LEFT, y, CONTENT_WIDTH, height=70, multiline=True)
    y = two_fields(ctx, ("scars_marks", "Scars, birthmarks, skin marks, or surgical marks - description and location"), ("piercings_jewellery", "Piercings, jewellery, dental work, braces, or other identifying features"), y, height=62, multiline=True)
    two_fields(ctx, ("mobility", "Mobility aid, prosthetic, disability, dominant hand, posture, gait, or recognizable movement"), ("other_description", "Other identifying details investigators may need"), y, height=62, multiline=True, private_left=True)
    finish_page(ctx)


def page_three(ctx: FormContext) -> None:
    y = header(ctx, 3, "Last seen, clothing, transportation")
    y = section_title(ctx, "3. Last seen and last contact", y)
    y = two_fields(ctx, ("last_seen_date", "Date and time last seen in person"), ("last_contact_date", "Date and time of last phone, text, email, or online contact"), y)
    y = two_fields(ctx, ("last_seen_by", "Last person known to see or contact them"), ("last_seen_by_contact", "That person's contact information"), y, private_right=True)
    y = ctx.text_field("private_location", "Exact last-seen or last-contact location for investigators", LEFT, y, CONTENT_WIDTH, height=55, help_text="Keep this private. Include address, unit, landmark, route, or coordinates only when useful to investigators.", multiline=True, private=True)
    y = ctx.text_field("public_area", "Broad area the investigating agency says may be safe to share publicly", LEFT, y, CONTENT_WIDTH, height=38, help_text="Use a community or region, not a private address.", multiline=True)
    y = two_fields(ctx, ("plans", "Plans, destination, who they expected to meet, and expected return time"), ("unusual", "What made you concerned; anything unusual or out of character"), y, height=52, multiline=True, private_right=True)
    y = two_fields(ctx, ("clothing", "Top, bottom, dress, uniform, or other clothing"), ("outerwear", "Coat, sweater, hat, head covering, gloves, or weather gear"), y, height=48, multiline=True)
    y = two_fields(ctx, ("footwear", "Shoes or boots - type, brand, colour, and size if known"), ("carried_items", "Jewellery, watch, bag, wallet, phone, mobility aid, or items carried"), y, height=42, multiline=True)
    ctx.text_field("vehicle", "Vehicle or transportation - year, make, model, colour, licence plate, jurisdiction, damage, stickers, bicycle, transit, taxi, rideshare, or walking route", LEFT, y, CONTENT_WIDTH, height=58, multiline=True)
    finish_page(ctx)


def timeline_row(ctx: FormContext, row: int, y: float) -> float:
    gap = 8
    date_w = 96
    event_w = 205
    source_w = CONTENT_WIDTH - date_w - event_w - 2 * gap
    y1 = ctx.text_field(f"timeline_{row}_date", f"{row}. Date and time", LEFT, y, date_w, height=38, multiline=True)
    y2 = ctx.text_field(f"timeline_{row}_event", "Place, contact, sighting, or event", LEFT + date_w + gap, y, event_w, height=38, multiline=True)
    y3 = ctx.text_field(f"timeline_{row}_source", "Who knows this and contact information", LEFT + date_w + gap + event_w + gap, y, source_w, height=38, multiline=True)
    return min(y1, y2, y3) - 2


def page_four(ctx: FormContext) -> None:
    y = header(ctx, 4, "Timeline, people, places, routines")
    y = section_title(ctx, "4. Timeline and confirmed information", y)
    y = draw_wrapped(ctx.c, "Mark estimates clearly and give investigators the source for each detail.", LEFT, y, CONTENT_WIDTH, size=7.8, color=MUTED) - 6
    for row in range(1, 6):
        y = timeline_row(ctx, row, y)
    y = two_fields(ctx, ("work_school", "Work, school, attendance, contacts, and travel routine"), ("regular_places", "Usual routes, appointments, cultural or spiritual places, and regular locations"), y, height=54, multiline=True, private_left=True, private_right=True)
    two_fields(ctx, ("important_people", "Family, friends, partners, co-workers, neighbours, Elders, and service-provider contacts"), ("devices_accounts", "Phone numbers, carriers, devices, email addresses, usernames, games, and social handles - no passwords or PINs"), y, height=62, multiline=True, private_left=True, private_right=True)
    finish_page(ctx)


def page_five(ctx: FormContext) -> None:
    y = header(ctx, 5, "Private safety and risk information")
    y = section_title(ctx, "5. Private safety and risk information", y)
    y = callout(ctx, "Personal questions are used to assess risk, not to judge", "Share these details privately with the investigating agency. Do not put them in public posts. You can say that you do not know and provide updates later.", y, 57, private=True)
    y = checklist(ctx, "risk_topic", RISK_TOPICS, y, private=True)
    y = ctx.text_field("health_medication", "Health, disability, medication, treatment, or urgent-care details", LEFT, y, CONTENT_WIDTH, height=88, multiline=True, private=True)
    y = ctx.text_field("risk_context", "Other private risk information, recent events, relationships, or likely locations investigators should know", LEFT, y, CONTENT_WIDTH, height=100, multiline=True, private=True)
    ctx.text_field("missing_items", "Items missing or left behind - phone, wallet, keys, identification, medication, clothing, cash, passport, vehicle, treasured item, or other belongings", LEFT, y, CONTENT_WIDTH, height=72, multiline=True, private=True)
    finish_page(ctx)


def page_six(ctx: FormContext) -> None:
    y = header(ctx, 6, "Photographs to gather")
    y = section_title(ctx, "6. Gather photographs - do not attach them here", y)
    y = callout(ctx, "Gather copies for investigators and keep originals safe", "This workbook does not ask for photographs and does not upload anything. Ask the investigator which image may be released publicly. A public image should respect how the person would want to be represented.", y, 63)
    y = checklist(ctx, "photo_gather", PHOTO_ITEMS, y)
    y = ctx.text_field("photo_location", "Where photo files or originals are safely kept; filenames supplied to investigators", LEFT, y, CONTENT_WIDTH, height=95, multiline=True)
    y = ctx.text_field("photo_delivery", "Who received each photo, date and method supplied, and whether it was approved for public release", LEFT, y, CONTENT_WIDTH, height=90, multiline=True)
    callout(ctx, "Protect dignity and privacy", "Do not post the completed workbook. Do not publish private addresses, shelters, witnesses, medical details, exact sensitive locations, accusations, graphic information, or an image the family has not approved.", y, 66, private=True)
    finish_page(ctx)


def page_seven(ctx: FormContext) -> None:
    y = header(ctx, 7, "Records and identification sources")
    y = section_title(ctx, "7. Gather records and possible identification sources", y)
    y = checklist(ctx, "record_gather", RECORD_ITEMS, y)
    y = two_fields(ctx, ("dentist", "Dentist / orthodontist name, office, phone, and dates treated"), ("medical", "Doctor, clinic, hospital, pharmacy, and phone"), y, height=72, multiline=True, private_left=True, private_right=True)
    y = two_fields(ctx, ("fingerprints", "Where fingerprints may exist"), ("records_status", "Who requested each record, date requested, and status"), y, height=62, multiline=True, private_left=True, private_right=True)
    y = ctx.text_field("identity_sources", "Other identification source, device, document, or provider investigators should know about", LEFT, y, CONTENT_WIDTH, height=65, multiline=True, private=True)
    callout(ctx, "Preserve before handling", "Ask the investigator before cleaning or disturbing the person's room, vehicle, clothing, toothbrush, hairbrush, razor, devices, or other belongings. Do not collect DNA yourself. Ask before accessing accounts or organizing a search that could create safety or evidence concerns.", y, 74, private=True)
    finish_page(ctx)


def agency_item(ctx: FormContext, index: int, text: str, y: float) -> float:
    ctx.c.setStrokeColor(LINE)
    ctx.c.line(LEFT, y - 24, RIGHT, y - 24)
    ctx.checkbox(f"agency_{index}_need", "Need to contact", LEFT + 2, y - 2, 92)
    ctx.checkbox(f"agency_{index}_called", "Contacted", LEFT + 98, y - 2, 80)
    draw_wrapped(ctx.c, text, LEFT + 190, y - 1, CONTENT_WIDTH - 190, font="Helvetica-Bold", size=7.3, leading=8.5)
    return y - 32


def page_eight(ctx: FormContext) -> None:
    y = header(ctx, 8, "Agency and support checklist")
    y = section_title(ctx, "8. Agencies and services", y)
    y = draw_wrapped(ctx.c, "Not every service fits every case. Start with emergency help and the agency taking the report. Ask the lead investigator which additional contacts are appropriate so reports stay coordinated.", LEFT, y, CONTENT_WIDTH, size=7.8, color=MUTED) - 9
    ctx.c.setFont("Helvetica-Bold", 7)
    ctx.c.setFillColor(MUTED)
    ctx.c.drawString(LEFT + 3, y, "STATUS")
    ctx.c.drawString(LEFT + 190, y, "AGENCY OR SERVICE")
    y -= 15
    for index, item in enumerate(ctx.copy.agency_items, start=1):
        y = agency_item(ctx, index, item, y)
    y = callout(ctx, "Country-specific contact note", ctx.copy.agency_note, y + 5, 48)
    y = ctx.text_field("additional_agencies", "Additional agency, advocate, victim service, Elder, interpreter, cultural support, coroner, medical examiner, or other contact", LEFT, y, CONTENT_WIDTH, height=72, multiline=True)
    ctx.text_field("coordination_notes", "Which agency leads, which agencies have the report, and how updates will be shared", LEFT, y, CONTENT_WIDTH, height=72, multiline=True)
    finish_page(ctx)


def call_log_row(ctx: FormContext, row: int, y: float) -> float:
    gap = 8
    col = (CONTENT_WIDTH - 2 * gap) / 3
    y1 = ctx.text_field(f"call_{row}_agency", f"{row}. Agency or service", LEFT, y, col, height=23)
    y2 = ctx.text_field(f"call_{row}_number", "Phone or email used", LEFT + col + gap, y, col, height=23)
    y3 = ctx.text_field(f"call_{row}_person", "Person spoken with", LEFT + 2 * (col + gap), y, col, height=23)
    next_y = min(y1, y2, y3)
    y1 = ctx.text_field(f"call_{row}_time", "Date and time", LEFT, next_y, col, height=22)
    y2 = ctx.text_field(f"call_{row}_reference", "File or reference number", LEFT + col + gap, next_y, col, height=22)
    y3 = ctx.text_field(f"call_{row}_next", "What they said, promised follow-up, and next action", LEFT + 2 * (col + gap), next_y, col, height=48, multiline=True)
    return min(y1, y2, y3) - 5


def call_log_page(ctx: FormContext, page_number: int, rows: range) -> None:
    y = header(ctx, page_number, "Detailed agency call log")
    y = section_title(ctx, f"9. Detailed agency call log - contacts {rows.start} to {rows.stop - 1}", y)
    y = draw_wrapped(ctx.c, "Record each call, visit, email, transfer, and promised follow-up. Write down names and times while the conversation is fresh.", LEFT, y, CONTENT_WIDTH, size=7.8, color=MUTED) - 8
    for row in rows:
        y = call_log_row(ctx, row, y)
    finish_page(ctx)


def page_eleven(ctx: FormContext) -> None:
    y = header(ctx, 11, "Questions, follow-up, public information")
    y = section_title(ctx, "10. Questions to ask the investigator", y)
    y = checklist(ctx, "investigator_question", ctx.copy.investigator_questions, y)
    y = two_fields(ctx, ("investigator_questions", "Other questions and the answers received"), ("next_steps", "Next steps - who is responsible and when to follow up"), y, height=78, multiline=True)
    y = section_title(ctx, "Information approved for public use", y)
    y = two_fields(ctx, ("approved_public", "Exact facts and photo filenames approved by the family and investigating agency"), ("official_tip_contact", "Official public tip phone, email, website, and case number"), y, height=72, multiline=True)
    y = two_fields(ctx, ("keep_private", "Information that must stay private or must not be published"), ("support_plan", "Trusted support, victim service, Elder, cultural support, interpreter, rest plan, or help with calls"), y, height=72, multiline=True, private_left=True)
    ctx.c.setFont("Helvetica-Bold", 7.2)
    ctx.c.setFillColor(INK)
    ctx.c.drawString(LEFT, y, "Official guidance used to shape this workbook (checked August 15, 2026)")
    source_y = y - 11
    for line in ctx.copy.source_lines:
        source_y = draw_wrapped(ctx.c, line, LEFT, source_y, CONTENT_WIDTH, size=6.4, leading=7.5, color=MUTED)
    finish_page(ctx)


def validate_pdf(path: Path, ctx: FormContext) -> None:
    reader = PdfReader(path)
    if len(reader.pages) != TOTAL_PAGES:
        raise RuntimeError(f"{path.name}: expected {TOTAL_PAGES} pages")
    fields = reader.get_fields() or {}
    if set(fields) != ctx.expected:
        missing = ctx.expected - set(fields)
        extra = set(fields) - ctx.expected
        raise RuntimeError(f"{path.name}: field mismatch missing={sorted(missing)} extra={sorted(extra)}")
    widgets = 0
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            widget = annotation.get_object()
            if widget.get("/Subtype") != "/Widget":
                continue
            widgets += 1
            parent = widget.get("/Parent")
            parent_object = parent.get_object() if parent else None
            field_name = str(widget.get("/T") or (parent_object.get("/T") if parent_object else ""))
            if field_name not in ctx.expected:
                raise RuntimeError(f"{path.name}: unexpected widget {field_name}")
            value = widget.get("/V") or (parent_object.get("/V") if parent_object else None)
            if field_name in ctx.checkboxes:
                if value not in (None, "/Off"):
                    raise RuntimeError(f"{path.name}: expected unchecked value for {field_name}")
            elif value not in (None, ""):
                raise RuntimeError(f"{path.name}: expected blank value for {field_name}")
            appearance = widget.get("/AP")
            if not appearance or not appearance.get("/N"):
                raise RuntimeError(f"{path.name}: widget {field_name} is missing a normal appearance")
    if widgets != len(ctx.expected):
        raise RuntimeError(f"{path.name}: expected {len(ctx.expected)} widgets, found {widgets}")

    sample_text = ctx.field_name("person_name")
    sample_check = ctx.field_name("first_step_1")
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.update_page_form_field_values(None, {sample_text: "SAMPLE FILLABILITY CHECK", sample_check: "/Yes"}, auto_regenerate=False)
    output = BytesIO()
    writer.write(output)
    output.seek(0)
    reopened = PdfReader(output)
    reopened_fields = reopened.get_fields() or {}
    if reopened_fields.get(sample_text, {}).get("/V") != "SAMPLE FILLABILITY CHECK":
        raise RuntimeError(f"{path.name}: text field did not retain a test value")
    if reopened_fields.get(sample_check, {}).get("/V") not in ("/Yes", "/On"):
        raise RuntimeError(f"{path.name}: checkbox did not retain a test value")


def generate(copy: CountryCopy) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / copy.filename
    c = canvas.Canvas(str(path), pagesize=letter, pageCompression=1)
    c.setTitle(f"MMIPS {copy.country} Family Investigator-Preparation Record")
    c.setAuthor("MMIPS")
    c.setSubject("Private, fillable investigator-preparation workbook and agency call log for families")
    ctx = FormContext(c=c, copy=copy)
    page_one(ctx)
    page_two(ctx)
    page_three(ctx)
    page_four(ctx)
    page_five(ctx)
    page_six(ctx)
    page_seven(ctx)
    page_eight(ctx)
    call_log_page(ctx, 9, range(1, 5))
    call_log_page(ctx, 10, range(5, 9))
    page_eleven(ctx)
    c.save()
    validate_pdf(path, ctx)
    return path


if __name__ == "__main__":
    for country in COUNTRIES:
        print(generate(country))

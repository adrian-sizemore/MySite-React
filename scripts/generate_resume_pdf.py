#!/usr/bin/env python3
"""Build the complete downloadable resume from the DRF aggregate payload."""

import argparse
import json
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
)


NAVY = colors.HexColor("#101a2c")
BLUE = colors.HexColor("#0b56b8")
SLATE = colors.HexColor("#344258")
LINE = colors.HexColor("#d8e0ea")


def text(value):
    return str(value or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def month(value):
    if not value:
        return ""
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").strftime("%b %Y")
    except ValueError:
        return value


def date_range(item):
    start = month(item.get("start_date"))
    end = "Present" if item.get("is_current") else month(item.get("end_date") or item.get("completion_date"))
    return " - ".join(part for part in (start, end) if part)


def styles():
    base = getSampleStyleSheet()
    return {
        "name": ParagraphStyle("Name", parent=base["Title"], fontName="Helvetica-Bold", fontSize=22, leading=25, textColor=NAVY, spaceAfter=3),
        "contact": ParagraphStyle("Contact", parent=base["Normal"], fontName="Helvetica", fontSize=9.5, leading=13, textColor=SLATE, spaceAfter=12),
        "section": ParagraphStyle("Section", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=BLUE, spaceBefore=16, spaceAfter=8, keepWithNext=True),
        "title": ParagraphStyle("ItemTitle", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=NAVY, spaceAfter=2, keepWithNext=True),
        "meta": ParagraphStyle("Meta", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=BLUE, spaceAfter=5, keepWithNext=True),
        "body": ParagraphStyle("Body", parent=base["BodyText"], fontName="Helvetica", fontSize=9, leading=13, textColor=SLATE, spaceAfter=6),
        "label": ParagraphStyle("Label", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=9, leading=13, textColor=NAVY, spaceBefore=4, spaceAfter=1, keepWithNext=True),
        "bullet": ParagraphStyle("Bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=9, leading=13, textColor=SLATE, leftIndent=13, firstLineIndent=-8, bulletIndent=2, spaceAfter=4),
    }


def add_paragraph(story, value, style):
    if value:
        story.append(Paragraph(text(value), style))


def add_bullet(story, value, style):
    if value:
        story.append(Paragraph(text(value), style, bulletText="•"))


def header_footer(canvas, doc, profile, document_label):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, 0.52 * inch, LETTER[0] - doc.rightMargin, 0.52 * inch)
    footer = f"{profile.get('full_name', '')} | {document_label} | Page {doc.page}"
    canvas.setFillColor(colors.HexColor("#657188"))
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(LETTER[0] - doc.rightMargin, 0.31 * inch, footer)
    canvas.restoreState()


def build(input_path, output_path, brief=False):
    with open(input_path, encoding="utf-8") as stream:
        data = json.load(stream)

    profile = data.get("profile") or {}
    document_label = "Brief Resume" if brief else "Complete Resume"
    style = styles()
    doc = BaseDocTemplate(
        output_path,
        pagesize=LETTER,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.68 * inch,
        title=f"{profile.get('full_name', '')} - {document_label}",
        author=profile.get("full_name", ""),
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="resume")
    doc.addPageTemplates(PageTemplate(id="resume", frames=[frame], onPage=lambda c, d: header_footer(c, d, profile, document_label)))
    story = []

    add_paragraph(story, profile.get("full_name"), style["name"])
    contact = " | ".join(filter(None, [profile.get("professional_title"), profile.get("location"), profile.get("email")]))
    add_paragraph(story, contact, style["contact"])
    add_paragraph(story, "Professional Summary", style["section"])
    add_paragraph(story, profile.get("full_summary") or profile.get("resume_summary") or profile.get("headline"), style["body"])

    add_paragraph(story, "Professional Experience", style["section"])
    for role in data.get("experience", []):
        heading = f"{text(role.get('job_title'))} | {text(role.get('company'))}"
        block = [Paragraph(heading, style["title"])]
        meta = " | ".join(filter(None, [date_range(role), role.get("location")]))
        if meta:
            block.append(Paragraph(text(meta), style["meta"]))
        if role.get("role_summary"):
            block.append(Paragraph(text(role["role_summary"]), style["body"]))
        story.append(KeepTogether(block))
        if not brief:
            for section in role.get("sections", []):
                add_paragraph(story, section.get("title"), style["label"])
                add_paragraph(story, section.get("body"), style["body"])
            for accomplishment in role.get("accomplishments", []):
                statement = accomplishment.get("statement") or accomplishment.get("title")
                add_bullet(story, statement, style["bullet"])
        story.append(Spacer(1, 5))

    add_paragraph(story, "Projects", style["section"])
    for project in data.get("projects", []):
        add_paragraph(story, project.get("name"), style["title"])
        add_paragraph(story, project.get("project_type"), style["meta"])
        add_paragraph(story, project.get("short_summary"), style["body"])
        if not brief:
            for label, key in (("Problem", "problem_statement"), ("Approach", "solution_summary"), ("Outcome", "outcome")):
                if project.get(key):
                    add_paragraph(story, label, style["label"])
                    add_paragraph(story, project[key], style["body"])
        story.append(Spacer(1, 5))

    add_paragraph(story, "Skills and Technologies", style["section"])
    for category in data.get("skill_categories", []):
        names = [skill.get("name") for skill in category.get("skills", []) if skill.get("name") != "CI/CD"]
        if names:
            add_paragraph(story, category.get("name"), style["title"])
            add_paragraph(story, ", ".join(names), style["body"])

    add_paragraph(story, "Military Service", style["section"])
    for service in data.get("military_service", []):
        add_paragraph(story, f"{service.get('branch', '')} | {service.get('role', '')}", style["title"])
        add_paragraph(story, " | ".join(filter(None, [date_range(service), service.get("location")])), style["meta"])
        add_paragraph(story, service.get("summary"), style["body"])
        if not brief:
            add_paragraph(story, service.get("full_description"), style["body"])

    add_paragraph(story, "Education", style["section"])
    for item in data.get("education", []):
        add_paragraph(story, item.get("institution"), style["title"])
        degree = " | ".join(filter(None, [item.get("degree"), item.get("field_of_study")]))
        add_paragraph(story, degree, style["body"])
        add_paragraph(story, " | ".join(filter(None, [item.get("status"), date_range(item)])), style["meta"])
        if not brief:
            add_paragraph(story, item.get("full_description") or item.get("summary"), style["body"])

    add_paragraph(story, "Certifications", style["section"])
    for item in data.get("certifications", []):
        add_paragraph(story, item.get("name"), style["title"])
        details = " | ".join(filter(None, [item.get("issuing_organization"), item.get("status"), item.get("credential_number")]))
        add_paragraph(story, details, style["meta"])
        if not brief:
            add_paragraph(story, item.get("full_description") or item.get("summary"), style["body"])

    if data.get("volunteering"):
        add_paragraph(story, "Volunteering", style["section"])
        for item in data["volunteering"]:
            add_paragraph(story, item.get("organization"), style["title"])
            add_paragraph(story, item.get("role"), style["meta"])
            add_paragraph(story, item.get("full_description") or item.get("summary"), style["body"])

    doc.build(story)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--brief", action="store_true")
    args = parser.parse_args()
    build(args.input, args.output, brief=args.brief)

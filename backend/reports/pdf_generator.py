# PDF Report Generator via ReportLab — Phase 5
# Generates research session briefs as downloadable PDFs

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib import colors
from datetime import datetime


def generate_session_report(session_data: dict, output_path: str) -> str:
    """
    Generates a beautifully formatted PDF report out of a given session.
    Includes the detected term glossaries and all user notes.
    """
    print(f"📄 Generating PDF export: {output_path}")
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title & Metadata
    story.append(Paragraph("VidSage — Research Session Brief", styles["Title"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    story.append(Spacer(1, 0.5 * cm))

    # Terms Section
    story.append(Paragraph("Detected Terms", styles["Heading1"]))
    for term in session_data.get("terms", []):
        domain_tag = term.get('domain', '')
        timestamp = term.get('first_timestamp', 0)
        
        heading_text = f"{term['term']} @ {timestamp:.1f}s — {domain_tag}"
        story.append(Paragraph(heading_text, styles["Heading2"]))
        story.append(Paragraph(term.get("summary", ""), styles["Normal"]))
        story.append(Spacer(1, 0.3 * cm))

    # Notes Section
    story.append(Paragraph("Research Notes & Reminders", styles["Heading1"]))
    rows = [["Timestamp", "Type", "Note"]]
    
    for note in session_data.get("notes", []):
        timestamp = f"{note.get('timestamp', 0):.1f}s"
        note_type = note.get("note_type", "general")
        text = note.get("text", "")
        rows.append([timestamp, note_type, text])
        
    if len(rows) > 1:
        t = Table(rows, colWidths=[2.5 * cm, 3 * cm, 11 * cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(t)

    # Build PDF
    doc.build(story)
    return output_path

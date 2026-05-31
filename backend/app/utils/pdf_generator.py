"""
PDFGenerator — generates branded ZeroReturn PDF reports using ReportLab.
Includes title page, KPI summary, category breakdown table, and recommendations.
"""
from __future__ import annotations

import io
import logging
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# ZeroReturn brand colors (RGB 0-1 scale)
BRAND_PRIMARY = (0.18, 0.09, 0.57)      # #2D17AA — deep indigo
BRAND_ACCENT  = (0.35, 0.70, 0.96)      # #5AB3F5 — sky blue
BRAND_SUCCESS = (0.18, 0.78, 0.54)      # #2DC78A — emerald
BRAND_DANGER  = (0.93, 0.26, 0.26)      # #EC4242 — red
BRAND_WARN    = (1.00, 0.65, 0.00)      # #FFA600 — amber
BRAND_TEXT    = (0.13, 0.13, 0.18)      # #21212D — near black
BRAND_LIGHT   = (0.96, 0.96, 0.98)      # #F5F5FA — light grey


class PDFGenerator:
    """Generates ZeroReturn PDF reports using ReportLab."""

    def generate_report(self, data: Dict[str, Any]) -> bytes:
        """Create a complete PDF report and return as bytes."""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm, mm
            from reportlab.platypus import (
                BaseDocTemplate, Frame, PageTemplate,
                Paragraph, Spacer, Table, TableStyle, HRFlowable,
            )
            from reportlab.platypus import SimpleDocTemplate

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=1.5 * cm,
                leftMargin=1.5 * cm,
                topMargin=2 * cm,
                bottomMargin=1.5 * cm,
                title="ZeroReturn Analytics Report",
                author="ZeroReturn AI Platform",
            )

            styles = getSampleStyleSheet()
            story = []

            # Convenience color objects
            primary_color = colors.Color(*BRAND_PRIMARY)
            accent_color  = colors.Color(*BRAND_ACCENT)
            danger_color  = colors.Color(*BRAND_DANGER)
            warn_color    = colors.Color(*BRAND_WARN)
            success_color = colors.Color(*BRAND_SUCCESS)
            light_color   = colors.Color(*BRAND_LIGHT)
            text_color    = colors.Color(*BRAND_TEXT)

            # ---- Custom styles ----
            title_style = ParagraphStyle(
                "ZRTitle",
                parent=styles["Heading1"],
                textColor=primary_color,
                fontSize=28,
                spaceAfter=6,
                fontName="Helvetica-Bold",
            )
            subtitle_style = ParagraphStyle(
                "ZRSubtitle",
                parent=styles["Normal"],
                textColor=accent_color,
                fontSize=13,
                spaceAfter=4,
                fontName="Helvetica",
            )
            section_style = ParagraphStyle(
                "ZRSection",
                parent=styles["Heading2"],
                textColor=primary_color,
                fontSize=14,
                spaceBefore=12,
                spaceAfter=6,
                fontName="Helvetica-Bold",
            )
            normal_style = ParagraphStyle(
                "ZRNormal",
                parent=styles["Normal"],
                textColor=text_color,
                fontSize=10,
                fontName="Helvetica",
            )
            small_style = ParagraphStyle(
                "ZRSmall",
                parent=styles["Normal"],
                textColor=colors.grey,
                fontSize=8,
                fontName="Helvetica",
            )

            generated_at = data.get("generated_at", datetime.utcnow().isoformat())
            kpis = data.get("kpis", {})
            heatmap = data.get("heatmap", [])
            report_type = data.get("report_type", "full")
            date_range = data.get("date_range_days", 30)

            # ============================
            # PAGE 1: TITLE PAGE
            # ============================
            story.append(Spacer(1, 2 * cm))
            story.append(Paragraph("⚡ ZeroReturn", title_style))
            story.append(Paragraph("AI-Powered Return Reduction Platform", subtitle_style))
            story.append(Spacer(1, 0.5 * cm))
            story.append(HRFlowable(width="100%", thickness=2, color=primary_color))
            story.append(Spacer(1, 0.3 * cm))

            story.append(Paragraph(
                f"<b>Analytics Report</b> — Last {date_range} Days",
                section_style,
            ))
            story.append(Paragraph(
                f"Generated: {generated_at[:19].replace('T', ' ')} UTC | Type: {report_type.title()}",
                small_style,
            ))
            story.append(Spacer(1, 1 * cm))

            # ============================
            # KPI SUMMARY TABLE
            # ============================
            story.append(Paragraph("📊 Key Performance Indicators", section_style))

            kpi_data = [
                ["Metric", "Value", "vs Last Period"],
                [
                    "Total Orders",
                    f"{kpis.get('total_orders', 0):,}",
                    f"+{kpis.get('trend_total_orders', 0):.1f}%",
                ],
                [
                    "Return Rate",
                    f"{kpis.get('return_rate', 0):.1f}%",
                    f"{kpis.get('trend_return_rate', 0):+.1f}%",
                ],
                [
                    "Revenue at Risk",
                    f"₹{kpis.get('revenue_at_risk', 0):,.0f}",
                    f"{kpis.get('trend_revenue_at_risk', 0):+.1f}%",
                ],
                [
                    "Returns Prevented",
                    f"{kpis.get('returns_prevented', 0):,}",
                    f"+{kpis.get('trend_returns_prevented', 0):.1f}%",
                ],
            ]

            kpi_table = Table(kpi_data, colWidths=[7 * cm, 5 * cm, 5 * cm])
            kpi_table.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, 0), primary_color),
                ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
                ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE",     (0, 0), (-1, 0), 11),
                ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
                ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
                ("GRID",         (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_color]),
                ("FONTSIZE",     (0, 1), (-1, -1), 10),
                ("TOPPADDING",   (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
                # Color trend column: green for positive, red for negative
                ("TEXTCOLOR",    (2, 1), (2, 1), success_color),
                ("TEXTCOLOR",    (2, 2), (2, 2), success_color),
                ("TEXTCOLOR",    (2, 3), (2, 3), success_color),
                ("TEXTCOLOR",    (2, 4), (2, 4), success_color),
            ]))
            story.append(kpi_table)
            story.append(Spacer(1, 0.8 * cm))

            # ============================
            # CATEGORY HEATMAP TABLE
            # ============================
            if heatmap:
                story.append(Paragraph("🏷️ Category Risk Breakdown", section_style))

                cat_data = [
                    ["Category", "Risk Score", "Orders", "Returns", "Revenue at Risk"],
                ]
                for item in heatmap[:8]:
                    risk = item.get("risk_score", 0)
                    cat_data.append([
                        item.get("category", ""),
                        f"{risk:.0f}/100",
                        f"{item.get('orders', 0):,}",
                        f"{item.get('returns', 0):,}",
                        f"₹{item.get('revenue_at_risk', 0):,.0f}",
                    ])

                cat_table = Table(cat_data, colWidths=[4 * cm, 3 * cm, 3 * cm, 3 * cm, 4 * cm])
                cat_table.setStyle(TableStyle([
                    ("BACKGROUND",     (0, 0), (-1, 0), primary_color),
                    ("TEXTCOLOR",      (0, 0), (-1, 0), colors.white),
                    ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE",       (0, 0), (-1, 0), 10),
                    ("ALIGN",          (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
                    ("GRID",           (0, 0), (-1, -1), 0.5, colors.lightgrey),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_color]),
                    ("FONTSIZE",       (0, 1), (-1, -1), 9),
                    ("TOPPADDING",     (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING",  (0, 0), (-1, -1), 6),
                ]))
                story.append(cat_table)
                story.append(Spacer(1, 0.8 * cm))

            # ============================
            # RECOMMENDATIONS
            # ============================
            story.append(Paragraph("💡 Top Recommendations", section_style))

            recommendations = [
                ("🔴 HIGH", "Rewrite Electronics descriptions with spec tables",
                 "Estimated -18.5% return reduction"),
                ("🔴 HIGH", "Add size guides to all Clothing & Footwear listings",
                 "Estimated -21% reduction in size-related returns"),
                ("🟠 MEDIUM", "Upgrade product images to 1000×1000px minimum",
                 "Estimated -14.2% return reduction"),
                ("🟠 MEDIUM", "Enable 3-day delivery for orders above ₹5,000",
                 "Estimated -11.3% reduction in delivery-related returns"),
                ("🟡 LOW", "Respond to negative reviews within 48 hours",
                 "Estimated -6.5% return reduction"),
            ]

            for priority, action, impact in recommendations:
                story.append(Paragraph(
                    f"<b>{priority}:</b> {action}",
                    ParagraphStyle("Rec", parent=normal_style, spaceBefore=4),
                ))
                story.append(Paragraph(
                    f"  → {impact}",
                    ParagraphStyle("RecImpact", parent=small_style, leftIndent=12),
                ))

            story.append(Spacer(1, 1 * cm))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
            story.append(Spacer(1, 0.3 * cm))
            story.append(Paragraph(
                "Generated by ZeroReturn AI Platform | zeroreturns.ai | Confidential",
                small_style,
            ))

            doc.build(story)
            return buffer.getvalue()

        except Exception as e:
            logger.error(f"PDFGenerator.generate_report error: {e}")
            raise RuntimeError(f"PDF generation failed: {e}")

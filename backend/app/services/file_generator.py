from datetime import date
from decimal import Decimal

from app.utils.timezone import now_sr


class FileGenerator:
    @staticmethod
    def generate_bank_statement_pdf(
        eod_date: date,
        bank_code: str,
        bank_name: str,
        total_debit: Decimal,
        total_credit: Decimal,
        net_position: Decimal,
        breakdown: list[dict],
    ) -> bytes:
        """
        Generate a PDF settlement statement for a single bank.
        Returns the PDF content as bytes.
        """
        import io
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        styles = getSampleStyleSheet()
        story = []

        # ── Title block ──
        title_style = ParagraphStyle(
            "title", parent=styles["Heading1"], fontSize=18, spaceAfter=4,
            textColor=colors.HexColor("#1e293b"),
        )
        subtitle_style = ParagraphStyle(
            "subtitle", parent=styles["Normal"], fontSize=11, spaceAfter=2,
            textColor=colors.HexColor("#475569"),
        )
        story.append(Paragraph("Clearing &amp; Settlement Statement", title_style))
        story.append(Paragraph(f"Bank: <b>{bank_code}</b> — {bank_name}", subtitle_style))
        story.append(Paragraph(f"Settlement Date: <b>{eod_date.strftime('%d %B %Y')}</b>", subtitle_style))
        story.append(Paragraph(
            f"Generated: {now_sr().strftime('%Y-%m-%d %H:%M:%S')} (Suriname Time)",
            ParagraphStyle("ts", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
        ))
        story.append(Spacer(1, 0.5 * cm))

        # ── Summary table ──
        net = float(net_position)
        net_color = colors.HexColor("#059669") if net >= 0 else colors.HexColor("#dc2626")
        summary_data = [
            ["Total Debit (Payable)", f"{total_debit:,.2f}"],
            ["Total Credit (Receivable)", f"{total_credit:,.2f}"],
            ["Net Position", f"{'+ ' if net > 0 else ''}{net_position:,.2f}"],
        ]
        summary_table = Table(summary_data, colWidths=[9 * cm, 6 * cm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#f0fdf4") if net >= 0 else colors.HexColor("#fef2f2")),
            ("TEXTCOLOR", (1, 2), (1, 2), net_color),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.6 * cm))

        # ── Counterparty breakdown heading ──
        story.append(Paragraph(
            "Counterparty Breakdown",
            ParagraphStyle("section", parent=styles["Heading2"], fontSize=13,
                           textColor=colors.HexColor("#1e293b"), spaceBefore=4, spaceAfter=8)
        ))

        if not breakdown:
            story.append(Paragraph("No counterparty data available.", styles["Normal"]))
        else:
            hdr_style = ParagraphStyle("th", parent=styles["Normal"], fontSize=9,
                                       textColor=colors.white, fontName="Helvetica-Bold")
            cell_style = ParagraphStyle("td", parent=styles["Normal"], fontSize=10)

            table_data = [[
                Paragraph("Counterparty", hdr_style),
                Paragraph("Gross Payable", hdr_style),
                Paragraph("Gross Receivable", hdr_style),
                Paragraph("Net Amount", hdr_style),
                Paragraph("Direction", hdr_style),
            ]]
            for row in breakdown:
                direction = row.get("net_direction", "")
                dir_text = "Even" if direction == "ZERO" else direction
                table_data.append([
                    Paragraph(f"<b>{row['bank_code']}</b><br/><font size='8' color='grey'>{row['bank_name']}</font>", cell_style),
                    Paragraph(f"{float(row['gross_payable']):,.2f}", cell_style),
                    Paragraph(f"{float(row['gross_receivable']):,.2f}", cell_style),
                    Paragraph(f"<b>{float(row['net_amount']):,.2f}</b>", cell_style),
                    Paragraph(dir_text, cell_style),
                ])

            col_widths = [5.5 * cm, 3.5 * cm, 3.5 * cm, 3 * cm, 2.5 * cm]
            detail_table = Table(table_data, colWidths=col_widths, repeatRows=1)
            detail_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
                ("ALIGN", (1, 0), (3, -1), "RIGHT"),
                ("ALIGN", (4, 0), (4, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(detail_table)

        # ── Footer ──
        story.append(Spacer(1, 1 * cm))
        story.append(Paragraph(
            "This document is a system-generated settlement statement. All amounts in local currency.",
            ParagraphStyle("footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey)
        ))

        doc.build(story)
        return buffer.getvalue()

    @staticmethod
    def generate_clearing_summary_pdf(
        eod_date: date,
        bank_positions: list[dict],
        bilateral_data: list[dict],
        total_debit: Decimal,
        total_credit: Decimal,
    ) -> bytes:
        """
        Generate a PDF clearing summary report showing all banks' net positions and bilateral netting.
        bank_positions dicts: {bank_code, bank_name, total_incoming, total_outgoing, net_position}
        bilateral_data dicts: {bank_a_code, bank_a_name, bank_b_code, bank_b_name, bank_a_owes_b, bank_b_owes_a, net_amount, net_direction}
        Returns the PDF content as bytes.
        """
        import io
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        styles = getSampleStyleSheet()
        story = []

        title_style = ParagraphStyle(
            "title", parent=styles["Heading1"], fontSize=18, spaceAfter=4,
            textColor=colors.HexColor("#1e293b"),
        )
        subtitle_style = ParagraphStyle(
            "subtitle", parent=styles["Normal"], fontSize=11, spaceAfter=2,
            textColor=colors.HexColor("#475569"),
        )
        section_style = ParagraphStyle(
            "section", parent=styles["Heading2"], fontSize=13,
            textColor=colors.HexColor("#1e293b"), spaceBefore=12, spaceAfter=6,
        )
        hdr_style = ParagraphStyle("th", parent=styles["Normal"], fontSize=9,
                                   textColor=colors.white, fontName="Helvetica-Bold")
        cell_style = ParagraphStyle("td", parent=styles["Normal"], fontSize=10)

        # ── Title block ──
        story.append(Paragraph("Clearing Summary Report", title_style))
        story.append(Paragraph(f"Settlement Date: <b>{eod_date.strftime('%d %B %Y')}</b>", subtitle_style))
        story.append(Paragraph(
            f"Generated: {now_sr().strftime('%Y-%m-%d %H:%M:%S')} (Suriname Time)",
            ParagraphStyle("ts", parent=styles["Normal"], fontSize=9, textColor=colors.grey),
        ))
        story.append(Spacer(1, 0.5 * cm))

        # ── System totals ──
        story.append(Paragraph("System Totals", section_style))
        totals_data = [
            ["Total Debit (Payable)", f"{total_debit:,.2f}"],
            ["Total Credit (Receivable)", f"{total_credit:,.2f}"],
            ["Net Balance", f"{(total_credit - total_debit):,.2f}"],
        ]
        totals_table = Table(totals_data, colWidths=[9 * cm, 6 * cm])
        totals_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 0.4 * cm))

        # ── Net Clearing Positions ──
        story.append(Paragraph("Net Clearing Positions", section_style))
        if not bank_positions:
            story.append(Paragraph("No clearing position data available.", styles["Normal"]))
        else:
            pos_header = [[
                Paragraph("Bank Code", hdr_style),
                Paragraph("Bank Name", hdr_style),
                Paragraph("As Acquirer (Incoming)", hdr_style),
                Paragraph("As Issuer (Outgoing)", hdr_style),
                Paragraph("Net Position", hdr_style),
                Paragraph("Instruction", hdr_style),
            ]]
            pos_rows = []
            for p in bank_positions:
                net = float(p["net_position"])
                instruction = "CR" if net > 0 else ("DR" if net < 0 else "ZERO")
                net_color = colors.HexColor("#059669") if net > 0 else (colors.HexColor("#dc2626") if net < 0 else colors.HexColor("#374151"))
                pos_rows.append([
                    Paragraph(f"<b>{p['bank_code']}</b>", cell_style),
                    Paragraph(p["bank_name"], cell_style),
                    Paragraph(f"{float(p['total_incoming']):,.2f}", cell_style),
                    Paragraph(f"{float(p['total_outgoing']):,.2f}", cell_style),
                    Paragraph(f"<b>{'+' if net > 0 else ''}{net:,.2f}</b>", cell_style),
                    Paragraph(f"<b><font color='{'#059669' if net > 0 else '#dc2626'}'>{instruction}</font></b>", cell_style),
                ])
            pos_table = Table(pos_header + pos_rows, colWidths=[2.5 * cm, 4 * cm, 3 * cm, 3 * cm, 2.8 * cm, 2 * cm], repeatRows=1)
            pos_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
                ("ALIGN", (2, 0), (4, -1), "RIGHT"),
                ("ALIGN", (5, 0), (5, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(pos_table)

        story.append(Spacer(1, 0.4 * cm))

        # ── Bilateral Netting ──
        story.append(Paragraph("Bilateral Netting", section_style))
        if not bilateral_data:
            story.append(Paragraph("No bilateral netting data available.", styles["Normal"]))
        else:
            bi_header = [[
                Paragraph("Issuer (Bank A)", hdr_style),
                Paragraph("Acquirer (Bank B)", hdr_style),
                Paragraph("A Owes B", hdr_style),
                Paragraph("B Owes A", hdr_style),
                Paragraph("Net Amount", hdr_style),
                Paragraph("Direction", hdr_style),
            ]]
            bi_rows = []
            for b in bilateral_data:
                direction = b["net_direction"]
                dir_text = "Even" if direction == "ZERO" else direction.replace("_", " → ")
                bi_rows.append([
                    Paragraph(f"<b>{b['bank_a_code']}</b><br/><font size='8' color='grey'>{b['bank_a_name']}</font>", cell_style),
                    Paragraph(f"<b>{b['bank_b_code']}</b><br/><font size='8' color='grey'>{b['bank_b_name']}</font>", cell_style),
                    Paragraph(f"{float(b['bank_a_owes_b']):,.2f}", cell_style),
                    Paragraph(f"{float(b['bank_b_owes_a']):,.2f}", cell_style),
                    Paragraph(f"<b>{float(b['net_amount']):,.2f}</b>", cell_style),
                    Paragraph(dir_text, cell_style),
                ])
            bi_table = Table(bi_header + bi_rows, colWidths=[3 * cm, 3 * cm, 2.8 * cm, 2.8 * cm, 2.8 * cm, 2.8 * cm], repeatRows=1)
            bi_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
                ("ALIGN", (2, 0), (4, -1), "RIGHT"),
                ("ALIGN", (5, 0), (5, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(bi_table)

        # ── Footer ──
        story.append(Spacer(1, 1 * cm))
        story.append(Paragraph(
            "This document is a system-generated clearing summary report. All amounts in local currency.",
            ParagraphStyle("footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey),
        ))

        doc.build(story)
        return buffer.getvalue()

<?php

namespace App\Services;

use ZipArchive;

/** Penulis .xlsx minimal (satu lembar) tanpa pustaka tambahan. Butuh ekstensi PHP zip. */
class XlsxWriter
{
    private static function esc(mixed $s): string
    {
        return htmlspecialchars(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', (string) $s), ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    private static function col(int $i): string
    {
        $s = '';
        for ($i++; $i > 0; $i = intdiv($i - 1, 26)) $s = chr(65 + ($i - 1) % 26).$s;
        return $s;
    }

    /** @param array<int, array{0: array, 1?: int}> $rows tiap baris: [sel[], gaya(0 biasa, 1 tebal)] */
    public static function build(array $rows, string $namaLembar = 'Laporan'): string
    {
        $xml = '';
        foreach ($rows as $n => $row) {
            [$cells, $style] = [$row[0], $row[1] ?? 0];
            $xml .= '<row r="'.($n + 1).'">';
            foreach (array_values($cells) as $c => $v) {
                if ($v === null || $v === '') continue;
                $ref = self::col($c).($n + 1);
                $xml .= (is_int($v) || is_float($v))
                    ? "<c r=\"$ref\" s=\"$style\"><v>$v</v></c>"
                    : "<c r=\"$ref\" s=\"$style\" t=\"inlineStr\"><is><t xml:space=\"preserve\">".self::esc($v).'</t></is></c>';
            }
            $xml .= '</row>';
        }
        $ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        $rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        $pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
        $head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $head.'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
        $zip->addFromString('_rels/.rels', $head."<Relationships xmlns=\"$pkg\"><Relationship Id=\"rId1\" Type=\"$rel/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
        $zip->addFromString('xl/workbook.xml', $head."<workbook xmlns=\"$ns\" xmlns:r=\"$rel\"><sheets><sheet name=\"".self::esc($namaLembar)."\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
        $zip->addFromString('xl/_rels/workbook.xml.rels', $head."<Relationships xmlns=\"$pkg\"><Relationship Id=\"rId1\" Type=\"$rel/worksheet\" Target=\"worksheets/sheet1.xml\"/><Relationship Id=\"rId2\" Type=\"$rel/styles\" Target=\"styles.xml\"/></Relationships>");
        $zip->addFromString('xl/styles.xml', $head."<styleSheet xmlns=\"$ns\"><fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font><font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts><fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills><borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"2\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/></cellXfs></styleSheet>");
        $zip->addFromString('xl/worksheets/sheet1.xml', $head."<worksheet xmlns=\"$ns\"><cols><col min=\"1\" max=\"12\" width=\"22\" customWidth=\"1\"/></cols><sheetData>$xml</sheetData></worksheet>");
        $zip->close();
        return $path;
    }
}

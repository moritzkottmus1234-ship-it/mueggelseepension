<?php
/**
 * MüggelSeepension · Anfrageformular per PHP-Mail
 *
 * Nur nötig, wenn Sie KEIN Formspree nutzen und Ihr Hosting PHP unterstützt (z. B. Hostinger).
 * Einrichtung:
 *   1. In index.html:     action="anfrage.php"
 *      In en/index.html:  action="../anfrage.php"
 *   2. Unten $EMPFAENGER und $ABSENDER prüfen. $ABSENDER sollte eine Adresse Ihrer eigenen Domain sein,
 *      sonst landen die Mails leicht im Spam.
 *   3. Einmal selbst eine Testanfrage senden.
 */
declare(strict_types=1);

$EMPFAENGER = 'kontakt@mueggelseepension.de';
$ABSENDER   = 'website@mueggelseepension.de';
$BETREFF    = 'Neue Zimmeranfrage über die Website';

header('X-Content-Type-Options: nosniff');
$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function antwort(bool $ok, string $msg, bool $json, int $code = 200): void
{
    http_response_code($code);
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $msg], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $ziel = './';
    $ref = $_SERVER['HTTP_REFERER'] ?? '';
    if ($ref !== '' && parse_url($ref, PHP_URL_HOST) === ($_SERVER['HTTP_HOST'] ?? '')) {
        $ziel = strtok($ref, '?#');
    }
    header('Location: ' . $ziel . '?anfrage=' . ($ok ? 'danke' : 'fehler') . '#anfrage', true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    antwort(false, 'Method not allowed', $wantsJson, 405);
}

// Spam-Schutz: dieses unsichtbare Feld füllen nur Bots aus.
if (!empty($_POST['_gotcha'])) {
    antwort(true, 'ok', $wantsJson);
}

$clean = static function ($wert, int $max = 2000): string {
    $wert = str_replace(["\r", "\0"], '', (string) $wert);
    return trim(mb_substr($wert, 0, $max, 'UTF-8'));
};
$einzeilig = static fn(string $s): string => trim(str_replace("\n", ' ', $s));

$name      = $einzeilig($clean($_POST['name'] ?? '', 200));
$email     = $einzeilig($clean($_POST['email'] ?? '', 200));
$telefon   = $einzeilig($clean($_POST['telefon'] ?? '', 60));
$gaeste    = $einzeilig($clean($_POST['gaeste'] ?? '', 20));
$anreise   = $einzeilig($clean($_POST['anreise'] ?? '', 20));
$abreise   = $einzeilig($clean($_POST['abreise'] ?? '', 20));
$zimmer    = $einzeilig($clean($_POST['zimmerwunsch'] ?? '', 80));
$nachricht = $clean($_POST['nachricht'] ?? '', 5000);
$consent   = !empty($_POST['datenschutz']);

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$consent) {
    antwort(false, 'Bitte füllen Sie alle Pflichtfelder aus.', $wantsJson, 422);
}

$datum = static function (string $iso): string {
    $d = DateTime::createFromFormat('Y-m-d', $iso);
    return $d ? $d->format('d.m.Y') : $iso;
};

$zeilen = [
    'Name'         => $name,
    'E-Mail'       => $email,
    'Telefon'      => $telefon,
    'Gäste'        => $gaeste,
    'Anreise'      => $anreise !== '' ? $datum($anreise) : '',
    'Abreise'      => $abreise !== '' ? $datum($abreise) : '',
    'Zimmerwunsch' => $zimmer,
];
$text = "Neue Anfrage über die Website:\n\n";
foreach ($zeilen as $feld => $wert) {
    if ($wert !== '') {
        $text .= str_pad($feld . ':', 15) . $wert . "\n";
    }
}
if ($nachricht !== '') {
    $text .= "\nNachricht:\n" . $nachricht . "\n";
}
$text .= "\nDatenschutzerklärung bestätigt: ja\nGesendet am: " . date('d.m.Y H:i') . " Uhr\n";

$headers = [
    'From: =?UTF-8?B?' . base64_encode('Website MüggelSeepension') . '?= <' . $ABSENDER . '>',
    'Reply-To: =?UTF-8?B?' . base64_encode($name) . '?= <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$ok = mail(
    $EMPFAENGER,
    '=?UTF-8?B?' . base64_encode($BETREFF) . '?=',
    $text,
    implode("\r\n", $headers)
);

antwort($ok, $ok ? 'ok' : 'Mailversand fehlgeschlagen', $wantsJson, $ok ? 200 : 500);

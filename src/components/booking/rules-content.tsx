interface RulesContentProps {
  reservationValidityDays: number;
}

/** Regeln der Gemeindefreizeit, verwendet auf /teilnahmebedingungen und im Prüfschritt der Anmeldung */
export function RulesContent({ reservationValidityDays }: RulesContentProps) {
  return (
    <div className="space-y-4 text-[14px] leading-relaxed text-foreground/85">
      <p className="font-semibold text-foreground">
        Die Teilnahmebedingungen zur Gemeindefreizeit sind für jeden Teilnehmer verbindlich. Mit der
        Anmeldung erklären sich die Teilnehmer mit den folgenden Regeln einverstanden.
      </p>

      <h3 className="font-bold text-foreground">§1 Freizeitleitung</h3>
      <p>Die Freizeitleitung besteht aus den Jugendleitern und ggf. weitere bestimmte Leiter. Den Anweisungen der Freizeitleitung ist in jedem Fall Folge zu leisten.</p>

      <h3 className="font-bold text-foreground">§2 Haftung</h3>
      <p>Für verlorene Gegenstände wird keinerlei Haftung übernommen. Die Teilnahme an der Gemeindefreizeit erfolgt auf eigene Verantwortung.</p>

      <h3 className="font-bold text-foreground">§3 Nachtruhe</h3>
      <p>Die festgelegte Nachtruhe muss eingehalten werden.</p>

      <h3 className="font-bold text-foreground">§4 Unterkünfte</h3>
      <p>Die Unterkünfte sind pfleglich zu behandeln und bei Abreise sauber und ordentlich zu hinterlassen.</p>

      <h3 className="font-bold text-foreground">§5 Kleidung</h3>
      <p>Auf freizügige oder unanständige Kleidung ist zu verzichten.</p>

      <h3 className="font-bold text-foreground">§6 Ausflüge und Aktivitäten</h3>
      <p>Besichtigungen und Ausflüge werden in definierten Kleingruppen erfolgen. Es ist nicht gestattet, sich ohne Zustimmung der Freizeitleitung von der Gruppe zu entfernen.</p>

      <h3 className="font-bold text-foreground">§7 Alkohol, Drogen und Rauschmittel</h3>
      <p>Jeglicher Alkoholkonsum ist verboten. Das Konsumieren und Mitführen von Drogen und Rauschmitteln ist ausnahmslos verboten. Rauchen ist in allen Gebäuden untersagt.</p>

      <h3 className="font-bold text-foreground">§8 Waffen</h3>
      <p>Es ist verboten, Waffen mitzunehmen. Was als Waffe gilt, liegt in der Entscheidungsmacht der Freizeitleitung.</p>

      <h3 className="font-bold text-foreground">§9 Verbotene Aktivitäten</h3>
      <p>Der Besuch von Kinos, Spielstätten, Diskotheken etc. ist strengstens untersagt.</p>

      <h3 className="font-bold text-foreground">§10 Besuche</h3>
      <p>Tagesbesuche oder Besuche von außenstehenden Personen sind nicht gestattet, da die Planbarkeit der Freizeit (Verpflegung, Unterkünfte, Programm) dadurch nicht mehr gewährleistet werden kann. Sollte in begründeten Ausnahmefällen dennoch jemand kommen müssen, ist dies zwingend im Voraus mit der Freizeitleitung abzustimmen.</p>

      <h3 className="font-bold text-foreground">§11 Ordnung und Ausschluss</h3>
      <p>Teilnehmer, die sich nicht an die Ordnung halten, werden zurechtgewiesen. Bei mehrfachen oder groben Zuwiderhandlungen haben die Leiter das Recht, Teilnehmer von der Freizeit auszuschließen. Die Folgekosten für die evtl. Rückreise müssen die Teilnehmer selbst tragen. Die Erstattung der Reisekosten ist nicht möglich.</p>

      <h3 className="font-bold text-foreground">§12 Regeländerungen</h3>
      <p>Nur durch die Erlaubnis der Freizeitleitung dürfen die Regeln geändert werden. Hierbei handelt es sich jedoch nicht um grundlegende Regeln.</p>

      <h3 className="font-bold text-foreground">§13 Zahlung</h3>
      <p>Die Zahlung des Hausbeitrags und der Kurtaxe erfolgt per Überweisung innerhalb von {reservationValidityDays} Tagen nach Reservierung. Die Kurtaxe führt der Verein gesammelt an das Feriendorf ab.</p>

      <h3 className="font-bold text-foreground">§14 Stornierung</h3>
      <p>Eine Stornierung ist grundsätzlich nicht möglich. Sollte ein Teilnehmer nicht mehr teilnehmen können, muss er eigenständig für Ersatz sorgen. Alternativ kann die Freizeitleitung kontaktiert werden, wir werden gemeinsam versuchen, einen Ersatz zu finden.</p>

      <h3 className="font-bold text-foreground">§15 Kinder und Jugendliche</h3>
      <p>Kinder unter 12 Jahren müssen von einem Erziehungsberechtigten begleitet werden. Die Aufsichtspflicht liegt bei den Eltern bzw. Erziehungsberechtigten.</p>
    </div>
  );
}

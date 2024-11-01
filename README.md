# Woordenschat Oefenapp

De applicatie is ontworpen met leerondersteuning voor kinderen met ADHD in gedachten, waarbij het herhalen van fouten de nadruk legt op positieve bekrachtiging en stimulans tot correct leren.
Deze applicatie biedt op dit moment een interactieve manier om woordenschat te oefenen
speciaal gericht op Spaanse woorden voor Nederlandse gebruikers. Gebruikers kunnen hun vaardigheden verbeteren door sets woorden te leren, herhalingssessies voor fouten te doen en hun scores bij te houden.

---

# Project Specifications

### Functionaliteit

De app heeft verschillende oefenlijsten voor woorden, waaronder basiswoorden (Unidad 1, Unidad 2) en getallen tot 100. Gebruikers kunnen een lijst en richting kiezen (Spaans-Nederlands of Nederlands-Spaans), waarna de app een serie vragen presenteert in 'levels' van vaste grootte (setSize). Binnen elk level kan de gebruiker foutieve antwoorden herhalen, totdat alle woorden correct zijn beantwoord. Elk correct afgerond level leidt naar een volgend niveau, waardoor progressie inzichtelijk blijft.

---

### Project Overzicht:

1. **Gebruikersinterface**: Maakt gebruik van eenvoudige HTML-elementen en CSS-styling voor gebruiksgemak en een overzichtelijke flow.
2. **Kiesbare lijsten en richtingen**: Gebruikers kunnen verschillende lijsten kiezen en de vertaalrichting aanpassen.
3. **Herhaling en feedback**: Foutieve antwoorden worden herhaald, met onmiddellijke feedback op de antwoorden.
4. **Opslag van Highscores**: Bij elke sessie worden highscores in local storage bewaard, per richting.
5. **Programmeerlogica voor ADHD en kinderen**: De applicatie is ontworpen met leerondersteuning in gedachten, waarbij het herhalen van fouten de nadruk legt op positieve bekrachtiging en stimulans tot correct leren.

---

### Overige Informatie

- **Toekomstige uitbreidingen**: Ondersteuning voor topografie-oefeningen en uitbreiding van gamification-elementen zoals badges en levels.

---

### HTML/CSS:

- **Opmaak en Interface**: Minimalistisch, gericht op duidelijkheid en focus. De interface bevat selecties voor oefenlijst, oefenrichting, en een score- en voortgangsweergave. Stijlen verbeteren de leesbaarheid en geven gebruikers feedback bij goede of foute antwoorden.
- **Adaptieve weergave**: De interface is ontworpen om flexibel te reageren op gebruikersacties, met motiverende berichten bij elke set en navigatie tussen levels.

### JavaScript:

- **Oefensessies**: Het script is opgebouwd rond oefensessies die bestaan uit sets met herhaalopties voor fouten. Bij elk level moeten alle woorden in de set correct worden beantwoord voordat gebruikers verder kunnen naar het volgende level. Herhaalsets worden aangeboden tot alle woorden correct zijn beantwoord.
- **Score- en voortgangsregistratie**: Gebruikers zien hun scores per set en ontvangen een score in de vorm van "Goed/Fout" na elke sessie. De app houdt ook persoonlijke highscores bij in local storage.
- **Herhaalsessies**: De app detecteert foute antwoorden en biedt herhaalsessies aan totdat alle fouten zijn gecorrigeerd. Bij een volledig afgeronde set gaat de gebruiker door naar het volgende level, wat de continuïteit van de oefening waarborgt.
- **Modulaire opbouw**: De code maakt gebruik van modulaire functies om leesbaarheid en onderhoudbaarheid te bevorderen. Er is een duidelijke scheiding tussen functionaliteit en datahandelingen.

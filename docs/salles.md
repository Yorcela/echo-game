# Numéros de salles

La carte compte **10 × 10 = 100 salles**, numérotées de **001 à 100**. Chaque case tire son numéro au hasard une fois pour toutes
(table figée dans `src/data/room-numbers.js`) : il ne change jamais d'une partie à l'autre, et deux numéros voisins ne sont pas des
salles voisines. Il apparaît sur la carte (touche M), en bas à gauche pendant la partie et dans l'en-tête de la carte.

Le contenu d'une case (quelle salle d'approche, quel boss d'aile) dépend de la graine ; le numéro suit la case.

| ligne \ colonne | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 009 | 014 | 004 | 013 | 033 | 003 | 018 | 065 | 052 | 040 |
| 1 | 037 | 039 | 062 | 036 | 084 | 044 | 051 | 087 | 095 | 079 |
| 2 | 078 | 045 | 002 | 061 | 021 | 056 | 099 | 017 | 031 | 047 |
| 3 | 029 | 068 | 090 | 043 | 057 | 038 | 007 | 022 | 015 | 054 |
| 4 | 024 | 020 | 069 | 041 | 025 | 097 | 055 | 067 | 032 | 016 |
| 5 | 098 | 074 | 066 | 048 | 050 | 058 | 049 | 076 | 010 | 023 |
| 6 | 035 | 071 | 042 | 008 | 063 | 026 | 011 | 100 | 073 | 012 |
| 7 | 060 | 083 | 027 | 046 | 053 | 085 | 082 | 086 | 081 | 091 |
| 8 | 094 | 092 | 077 | 030 | 059 | 001 | 034 | 019 | 070 | 064 |
| 9 | 005 | 028 | 088 | 096 | 006 | 075 | 093 | 089 | 072 | 080 |

Ligne 0, colonne 4 : le Hall des Échos (arène du Roi). Ligne 4, colonne 5 : l'aile aquatique.

// ECO to Opening Names Mapping
// This file provides proper opening names instead of ECO codes like "B23"

const ecoToNames = {
  // A00-A09: Irregular Openings
  'A00': 'Irregular Opening',
  'A01': 'Nimzowitsch-Larsen Attack',
  'A02': 'Bird\'s Opening',
  'A03': 'Bird\'s Opening, From\'s Gambit',
  'A04': 'Reti Opening',
  'A05': 'Reti Opening',
  'A06': 'Reti Opening',
  'A07': 'Reti Opening, King\'s Indian Attack',
  'A08': 'Reti Opening, King\'s Indian Attack',
  'A09': 'Reti Opening',

  // A10-A19: English Opening
  'A10': 'English Opening',
  'A11': 'English Opening, Caro-Kann Defence',
  'A12': 'English Opening',
  'A13': 'English Opening',
  'A14': 'English Opening',
  'A15': 'English Opening',
  'A16': 'English Opening',
  'A17': 'English Opening',
  'A18': 'English Opening, Mikenas-Carls',
  'A19': 'English Opening, Mikenas-Carls',

  // A20-A29: English Opening
  'A20': 'English Opening',
  'A21': 'English Opening',
  'A22': 'English Opening',
  'A23': 'English Opening, Bremen System',
  'A24': 'English Opening, Bremen System',
  'A25': 'English Opening',
  'A26': 'English Opening',
  'A27': 'English Opening, Three Knights System',
  'A28': 'English Opening, Four Knights System',
  'A29': 'English Opening, Four Knights System',

  // A30-A39: English Opening
  'A30': 'English Opening, Symmetrical',
  'A31': 'English Opening, Symmetrical',
  'A32': 'English Opening, Symmetrical',
  'A33': 'English Opening, Symmetrical',
  'A34': 'English Opening, Symmetrical',
  'A35': 'English Opening, Symmetrical',
  'A36': 'English Opening, Symmetrical',
  'A37': 'English Opening, Symmetrical',
  'A38': 'English Opening, Symmetrical',
  'A39': 'English Opening, Symmetrical',

  // A40-A49: Queen's Pawn Game
  'A40': 'Queen\'s Pawn Game',
  'A41': 'Queen\'s Pawn Game',
  'A42': 'Modern Defence, Averbakh System',
  'A43': 'Old Benoni Defence',
  'A44': 'Old Benoni Defence',
  'A45': 'Queen\'s Pawn Game',
  'A46': 'Queen\'s Pawn Game',
  'A47': 'Queen\'s Indian Defence',
  'A48': 'King\'s Indian Defence',
  'A49': 'King\'s Indian Defence',

  // A50-A59: Queen's Pawn Game
  'A50': 'Queen\'s Pawn Game',
  'A51': 'Budapest Defence',
  'A52': 'Budapest Defence',
  'A53': 'Old Indian Defence',
  'A54': 'Old Indian Defence',
  'A55': 'Old Indian Defence',
  'A56': 'Benoni Defence',
  'A57': 'Benko Gambit',
  'A58': 'Benko Gambit',
  'A59': 'Benko Gambit',

  // A60-A69: Benoni Defence
  'A60': 'Benoni Defence',
  'A61': 'Benoni Defence',
  'A62': 'Benoni Defence, Fianchetto Variation',
  'A63': 'Benoni Defence, Fianchetto Variation',
  'A64': 'Benoni Defence, Fianchetto Variation',
  'A65': 'Benoni Defence',
  'A66': 'Benoni Defence',
  'A67': 'Benoni Defence, Taimanov Variation',
  'A68': 'Benoni Defence, Four Pawns Attack',
  'A69': 'Benoni Defence, Four Pawns Attack',

  // A70-A79: Benoni Defence
  'A70': 'Benoni Defence',
  'A71': 'Benoni Defence',
  'A72': 'Benoni Defence',
  'A73': 'Benoni Defence',
  'A74': 'Benoni Defence',
  'A75': 'Benoni Defence',
  'A76': 'Benoni Defence',
  'A77': 'Benoni Defence',
  'A78': 'Benoni Defence',
  'A79': 'Benoni Defence',

  // A80-A89: Dutch Defence
  'A80': 'Dutch Defence',
  'A81': 'Dutch Defence',
  'A82': 'Dutch Defence',
  'A83': 'Dutch Defence, Staunton Gambit',
  'A84': 'Dutch Defence',
  'A85': 'Dutch Defence',
  'A86': 'Dutch Defence',
  'A87': 'Dutch Defence, Leningrad Variation',
  'A88': 'Dutch Defence, Leningrad Variation',
  'A89': 'Dutch Defence, Leningrad Variation',

  // A90-A99: Dutch Defence
  'A90': 'Dutch Defence',
  'A91': 'Dutch Defence',
  'A92': 'Dutch Defence',
  'A93': 'Dutch Defence, Stonewall Variation',
  'A94': 'Dutch Defence, Stonewall Variation',
  'A95': 'Dutch Defence, Stonewall Variation',
  'A96': 'Dutch Defence, Classical Variation',
  'A97': 'Dutch Defence, Classical Variation',
  'A98': 'Dutch Defence, Classical Variation',
  'A99': 'Dutch Defence, Classical Variation',

  // B00-B09: King's Pawn Opening
  'B00': 'King\'s Pawn Opening',
  'B01': 'Scandinavian Defence',
  'B02': 'Alekhine\'s Defence',
  'B03': 'Alekhine\'s Defence',
  'B04': 'Alekhine\'s Defence, Modern Variation',
  'B05': 'Alekhine\'s Defence, Modern Variation',
  'B06': 'Robatsch Defence',
  'B07': 'Pirc Defence',
  'B08': 'Pirc Defence',
  'B09': 'Pirc Defence',

  // B10-B19: Caro-Kann Defence
  'B10': 'Caro-Kann Defence',
  'B11': 'Caro-Kann Defence, Two Knights Variation',
  'B12': 'Caro-Kann Defence',
  'B13': 'Caro-Kann Defence, Exchange Variation',
  'B14': 'Caro-Kann Defence, Panov-Botvinnik Attack',
  'B15': 'Caro-Kann Defence',
  'B16': 'Caro-Kann Defence, Bronstein-Larsen Variation',
  'B17': 'Caro-Kann Defence, Steinitz Variation',
  'B18': 'Caro-Kann Defence, Classical Variation',
  'B19': 'Caro-Kann Defence, Classical Variation',

  // B20-B29: Sicilian Defence
  'B20': 'Sicilian Defence',
  'B21': 'Sicilian Defence, Grand Prix Attack',
  'B22': 'Sicilian Defence, Alapin Variation',
  'B23': 'Sicilian Defence, Closed',
  'B24': 'Sicilian Defence, Closed',
  'B25': 'Sicilian Defence, Closed',
  'B26': 'Sicilian Defence, Closed',
  'B27': 'Sicilian Defence, Hyperaccelerated Dragon',
  'B28': 'Sicilian Defence, O\'Kelly Variation',
  'B29': 'Sicilian Defence, Nimzowitsch-Rubinstein',

  // B30-B39: Sicilian Defence
  'B30': 'Sicilian Defence',
  'B31': 'Sicilian Defence, Nimzowitsch-Rubinstein',
  'B32': 'Sicilian Defence, Labourdonnais-Loewenthal',
  'B33': 'Sicilian Defence, Lasker-Pelikan Variation',
  'B34': 'Sicilian Defence, Accelerated Dragon',
  'B35': 'Sicilian Defence, Accelerated Dragon',
  'B36': 'Sicilian Defence, Accelerated Dragon',
  'B37': 'Sicilian Defence, Accelerated Dragon',
  'B38': 'Sicilian Defence, Accelerated Dragon',
  'B39': 'Sicilian Defence, Accelerated Dragon',

  // B40-B49: Sicilian Defence
  'B40': 'Sicilian Defence',
  'B41': 'Sicilian Defence, Kan Variation',
  'B42': 'Sicilian Defence, Kan Variation',
  'B43': 'Sicilian Defence, Kan Variation',
  'B44': 'Sicilian Defence',
  'B45': 'Sicilian Defence, Taimanov Variation',
  'B46': 'Sicilian Defence, Taimanov Variation',
  'B47': 'Sicilian Defence, Taimanov Variation',
  'B48': 'Sicilian Defence, Taimanov Variation',
  'B49': 'Sicilian Defence, Taimanov Variation',

  // B50-B59: Sicilian Defence
  'B50': 'Sicilian Defence',
  'B51': 'Sicilian Defence, Canal-Sokolsky Attack',
  'B52': 'Sicilian Defence, Canal-Sokolsky Attack',
  'B53': 'Sicilian Defence, Chekhover Variation',
  'B54': 'Sicilian Defence, Chekhover Variation',
  'B55': 'Sicilian Defence, Prins Variation',
  'B56': 'Sicilian Defence',
  'B57': 'Sicilian Defence, Sozin Variation',
  'B58': 'Sicilian Defence, Sozin Variation',
  'B59': 'Sicilian Defence, Sozin Variation',

  // B60-B69: Sicilian Defence
  'B60': 'Sicilian Defence, Richter-Rauzer Attack',
  'B61': 'Sicilian Defence, Richter-Rauzer Attack',
  'B62': 'Sicilian Defence, Richter-Rauzer Attack',
  'B63': 'Sicilian Defence, Richter-Rauzer Attack',
  'B64': 'Sicilian Defence, Richter-Rauzer Attack',
  'B65': 'Sicilian Defence, Richter-Rauzer Attack',
  'B66': 'Sicilian Defence, Richter-Rauzer Attack',
  'B67': 'Sicilian Defence, Richter-Rauzer Attack',
  'B68': 'Sicilian Defence, Richter-Rauzer Attack',
  'B69': 'Sicilian Defence, Richter-Rauzer Attack',

  // B70-B79: Sicilian Defence
  'B70': 'Sicilian Defence, Dragon Variation',
  'B71': 'Sicilian Defence, Dragon Variation',
  'B72': 'Sicilian Defence, Dragon Variation',
  'B73': 'Sicilian Defence, Dragon Variation',
  'B74': 'Sicilian Defence, Dragon Variation',
  'B75': 'Sicilian Defence, Dragon Variation',
  'B76': 'Sicilian Defence, Dragon Variation',
  'B77': 'Sicilian Defence, Dragon Variation',
  'B78': 'Sicilian Defence, Dragon Variation',
  'B79': 'Sicilian Defence, Dragon Variation',

  // B80-B89: Sicilian Defence
  'B80': 'Sicilian Defence, Scheveningen Variation',
  'B81': 'Sicilian Defence, Scheveningen Variation',
  'B82': 'Sicilian Defence, Scheveningen Variation',
  'B83': 'Sicilian Defence, Scheveningen Variation',
  'B84': 'Sicilian Defence, Scheveningen Variation',
  'B85': 'Sicilian Defence, Scheveningen Variation',
  'B86': 'Sicilian Defence, Sozin Attack',
  'B87': 'Sicilian Defence, Sozin Attack',
  'B88': 'Sicilian Defence, Sozin Attack',
  'B89': 'Sicilian Defence, Sozin Attack',

  // B90-B99: Sicilian Defence
  'B90': 'Sicilian Defence, Najdorf Variation',
  'B91': 'Sicilian Defence, Najdorf Variation',
  'B92': 'Sicilian Defence, Najdorf Variation',
  'B93': 'Sicilian Defence, Najdorf Variation',
  'B94': 'Sicilian Defence, Najdorf Variation',
  'B95': 'Sicilian Defence, Najdorf Variation',
  'B96': 'Sicilian Defence, Najdorf Variation',
  'B97': 'Sicilian Defence, Najdorf Variation',
  'B98': 'Sicilian Defence, Najdorf Variation',
  'B99': 'Sicilian Defence, Najdorf Variation',

  // C00-C09: French Defence
  'C00': 'French Defence',
  'C01': 'French Defence, Exchange Variation',
  'C02': 'French Defence, Advance Variation',
  'C03': 'French Defence, Tarrasch Variation',
  'C04': 'French Defence, Tarrasch Variation',
  'C05': 'French Defence, Tarrasch Variation',
  'C06': 'French Defence, Tarrasch Variation',
  'C07': 'French Defence, Tarrasch Variation',
  'C08': 'French Defence, Tarrasch Variation',
  'C09': 'French Defence, Tarrasch Variation',

  // C10-C19: French Defence
  'C10': 'French Defence',
  'C11': 'French Defence',
  'C12': 'French Defence, McCutcheon Variation',
  'C13': 'French Defence, Classical Variation',
  'C14': 'French Defence, Classical Variation',
  'C15': 'French Defence, Winawer Variation',
  'C16': 'French Defence, Winawer Variation',
  'C17': 'French Defence, Winawer Variation',
  'C18': 'French Defence, Winawer Variation',
  'C19': 'French Defence, Winawer Variation',

  // C20-C29: King's Pawn Game
  'C20': 'King\'s Pawn Game',
  'C21': 'Centre Game',
  'C22': 'Centre Game',
  'C23': 'Bishop\'s Opening',
  'C24': 'Bishop\'s Opening',
  'C25': 'Vienna Game',
  'C26': 'Vienna Game',
  'C27': 'Vienna Game',
  'C28': 'Vienna Game',
  'C29': 'Vienna Game',

  // C30-C39: King's Gambit
  'C30': 'King\'s Gambit',
  'C31': 'King\'s Gambit, Falkbeer Counter-gambit',
  'C32': 'King\'s Gambit, Falkbeer Counter-gambit',
  'C33': 'King\'s Gambit',
  'C34': 'King\'s Gambit',
  'C35': 'King\'s Gambit, Cunningham Defence',
  'C36': 'King\'s Gambit, Cunningham Defence',
  'C37': 'King\'s Gambit',
  'C38': 'King\'s Gambit',
  'C39': 'King\'s Gambit',

  // C40-C49: King's Knight Opening
  'C40': 'King\'s Knight Opening',
  'C41': 'Philidor Defence',
  'C42': 'Petrov Defence',
  'C43': 'Petrov Defence',
  'C44': 'King\'s Pawn Game',
  'C45': 'Scotch Game',
  'C46': 'Three Knights Game',
  'C47': 'Four Knights Game',
  'C48': 'Four Knights Game',
  'C49': 'Four Knights Game',

  // C50-C59: Giuoco Piano
  'C50': 'Giuoco Piano',
  'C51': 'Evans Gambit',
  'C52': 'Evans Gambit',
  'C53': 'Giuoco Piano',
  'C54': 'Giuoco Piano',
  'C55': 'Giuoco Piano',
  'C56': 'Giuoco Piano',
  'C57': 'Giuoco Piano',
  'C58': 'Giuoco Piano',
  'C59': 'Giuoco Piano',

  // C60-C69: Ruy Lopez
  'C60': 'Ruy Lopez',
  'C61': 'Ruy Lopez, Bird\'s Defence',
  'C62': 'Ruy Lopez, Old Steinitz Defence',
  'C63': 'Ruy Lopez, Schliemann Defence',
  'C64': 'Ruy Lopez, Classical Defence',
  'C65': 'Ruy Lopez, Berlin Defence',
  'C66': 'Ruy Lopez, Berlin Defence',
  'C67': 'Ruy Lopez, Berlin Defence',
  'C68': 'Ruy Lopez, Exchange Variation',
  'C69': 'Ruy Lopez, Exchange Variation',

  // C70-C79: Ruy Lopez
  'C70': 'Ruy Lopez',
  'C71': 'Ruy Lopez',
  'C72': 'Ruy Lopez, Modern Steinitz Defence',
  'C73': 'Ruy Lopez, Modern Steinitz Defence',
  'C74': 'Ruy Lopez, Modern Steinitz Defence',
  'C75': 'Ruy Lopez, Modern Steinitz Defence',
  'C76': 'Ruy Lopez, Modern Steinitz Defence',
  'C77': 'Ruy Lopez, Morphy Defence',
  'C78': 'Ruy Lopez, Morphy Defence',
  'C79': 'Ruy Lopez, Steinitz Defence',

  // C80-C89: Ruy Lopez
  'C80': 'Ruy Lopez, Open',
  'C81': 'Ruy Lopez, Open, Howell Attack',
  'C82': 'Ruy Lopez, Open, Marshall Attack',
  'C83': 'Ruy Lopez, Open',
  'C84': 'Ruy Lopez, Closed',
  'C85': 'Ruy Lopez, Exchange Variation',
  'C86': 'Ruy Lopez, Worrall Attack',
  'C87': 'Ruy Lopez, Averbakh Variation',
  'C88': 'Ruy Lopez, Closed',
  'C89': 'Ruy Lopez, Marshall Attack',

  // C90-C99: Ruy Lopez
  'C90': 'Ruy Lopez, Closed',
  'C91': 'Ruy Lopez, Closed',
  'C92': 'Ruy Lopez, Closed',
  'C93': 'Ruy Lopez, Closed, Smyslov Defence',
  'C94': 'Ruy Lopez, Closed, Breyer Defence',
  'C95': 'Ruy Lopez, Closed, Breyer Defence',
  'C96': 'Ruy Lopez, Closed, Chigorin Defence',
  'C97': 'Ruy Lopez, Closed, Chigorin Defence',
  'C98': 'Ruy Lopez, Closed, Chigorin Defence',
  'C99': 'Ruy Lopez, Closed, Chigorin Defence',

  // D00-D09: Queen's Pawn Game
  'D00': 'Queen\'s Pawn Game',
  'D01': 'Richter-Veresov Attack',
  'D02': 'Queen\'s Pawn Game',
  'D03': 'Torre Attack',
  'D04': 'Queen\'s Pawn Game',
  'D05': 'Queen\'s Pawn Game',
  'D06': 'Queen\'s Gambit',
  'D07': 'Queen\'s Gambit Declined, Chigorin Defence',
  'D08': 'Queen\'s Gambit Declined, Albin Counter-gambit',
  'D09': 'Queen\'s Gambit Declined, Albin Counter-gambit',

  // D10-D19: Queen's Gambit
  'D10': 'Queen\'s Gambit Declined',
  'D11': 'Queen\'s Gambit Declined',
  'D12': 'Queen\'s Gambit Declined, Slav Defence',
  'D13': 'Queen\'s Gambit Declined, Slav Defence',
  'D14': 'Queen\'s Gambit Declined, Slav Defence',
  'D15': 'Queen\'s Gambit Declined, Slav Defence',
  'D16': 'Queen\'s Gambit Declined, Slav Defence',
  'D17': 'Queen\'s Gambit Declined, Slav Defence',
  'D18': 'Queen\'s Gambit Declined, Dutch Variation',
  'D19': 'Queen\'s Gambit Declined, Dutch Variation',

  // D20-D29: Queen's Gambit
  'D20': 'Queen\'s Gambit Accepted',
  'D21': 'Queen\'s Gambit Accepted',
  'D22': 'Queen\'s Gambit Accepted',
  'D23': 'Queen\'s Gambit Accepted',
  'D24': 'Queen\'s Gambit Accepted',
  'D25': 'Queen\'s Gambit Accepted',
  'D26': 'Queen\'s Gambit Accepted',
  'D27': 'Queen\'s Gambit Accepted, Classical Variation',
  'D28': 'Queen\'s Gambit Accepted, Classical Variation',
  'D29': 'Queen\'s Gambit Accepted, Classical Variation',

  // D30-D39: Queen's Gambit Declined
  'D30': 'Queen\'s Gambit Declined',
  'D31': 'Queen\'s Gambit Declined',
  'D32': 'Queen\'s Gambit Declined, Tarrasch Defence',
  'D33': 'Queen\'s Gambit Declined, Tarrasch Defence',
  'D34': 'Queen\'s Gambit Declined, Tarrasch Defence',
  'D35': 'Queen\'s Gambit Declined, Exchange Variation',
  'D36': 'Queen\'s Gambit Declined, Exchange Variation',
  'D37': 'Queen\'s Gambit Declined, Harrwitz Attack',
  'D38': 'Queen\'s Gambit Declined, Ragozin Variation',
  'D39': 'Queen\'s Gambit Declined, Ragozin Variation',

  // D40-D49: Queen's Gambit Declined
  'D40': 'Queen\'s Gambit Declined, Semi-Tarrasch Defence',
  'D41': 'Queen\'s Gambit Declined, Semi-Tarrasch Defence',
  'D42': 'Queen\'s Gambit Declined, Semi-Tarrasch Defence',
  'D43': 'Queen\'s Gambit Declined, Semi-Slav Defence',
  'D44': 'Queen\'s Gambit Declined, Semi-Slav Defence',
  'D45': 'Queen\'s Gambit Declined, Semi-Slav Defence',
  'D46': 'Queen\'s Gambit Declined, Semi-Slav Defence',
  'D47': 'Queen\'s Gambit Declined, Semi-Slav Defence',
  'D48': 'Queen\'s Gambit Declined, Semi-Slav Defence',
  'D49': 'Queen\'s Gambit Declined, Semi-Slav Defence',

  // D50-D59: Queen's Gambit Declined
  'D50': 'Queen\'s Gambit Declined',
  'D51': 'Queen\'s Gambit Declined',
  'D52': 'Queen\'s Gambit Declined',
  'D53': 'Queen\'s Gambit Declined',
  'D54': 'Queen\'s Gambit Declined, Anti-Tartakower Attack',
  'D55': 'Queen\'s Gambit Declined, Anti-Tartakower Attack',
  'D56': 'Queen\'s Gambit Declined, Lasker Defence',
  'D57': 'Queen\'s Gambit Declined, Lasker Defence',
  'D58': 'Queen\'s Gambit Declined, Tartakower Defence',
  'D59': 'Queen\'s Gambit Declined, Tartakower Defence',

  // D60-D69: Queen's Gambit Declined
  'D60': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D61': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D62': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D63': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D64': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D65': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D66': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D67': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D68': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D69': 'Queen\'s Gambit Declined, Orthodox Defence',

  // D70-D79: Neo-Grünfeld Defence
  'D70': 'Neo-Grünfeld Defence',
  'D71': 'Neo-Grünfeld Defence',
  'D72': 'Neo-Grünfeld Defence',
  'D73': 'Neo-Grünfeld Defence',
  'D74': 'Neo-Grünfeld Defence',
  'D75': 'Neo-Grünfeld Defence',
  'D76': 'Neo-Grünfeld Defence',
  'D77': 'Neo-Grünfeld Defence',
  'D78': 'Neo-Grünfeld Defence',
  'D79': 'Neo-Grünfeld Defence',

  // D80-D89: Grünfeld Defence
  'D80': 'Grünfeld Defence',
  'D81': 'Grünfeld Defence, Russian Variation',
  'D82': 'Grünfeld Defence, Russian Variation',
  'D83': 'Grünfeld Defence, Russian Variation',
  'D84': 'Grünfeld Defence, Russian Variation',
  'D85': 'Grünfeld Defence, Exchange Variation',
  'D86': 'Grünfeld Defence, Exchange Variation',
  'D87': 'Grünfeld Defence, Exchange Variation',
  'D88': 'Grünfeld Defence, Exchange Variation',
  'D89': 'Grünfeld Defence, Exchange Variation',

  // D90-D99: Grünfeld Defence
  'D90': 'Grünfeld Defence',
  'D91': 'Grünfeld Defence, Three Knights Variation',
  'D92': 'Grünfeld Defence, Three Knights Variation',
  'D93': 'Grünfeld Defence, Three Knights Variation',
  'D94': 'Grünfeld Defence, Three Knights Variation',
  'D95': 'Grünfeld Defence, Three Knights Variation',
  'D96': 'Grünfeld Defence, Russian Variation',
  'D97': 'Grünfeld Defence, Russian Variation',
  'D98': 'Grünfeld Defence, Russian Variation',
  'D99': 'Grünfeld Defence, Russian Variation',

  // E00-E09: Queen's Pawn Game
  'E00': 'Queen\'s Pawn Game',
  'E01': 'Catalan Opening',
  'E02': 'Catalan Opening',
  'E03': 'Catalan Opening',
  'E04': 'Catalan Opening',
  'E05': 'Catalan Opening',
  'E06': 'Catalan Opening',
  'E07': 'Catalan Opening',
  'E08': 'Catalan Opening',
  'E09': 'Catalan Opening',

  // E10-E19: Queen's Pawn Game
  'E10': 'Queen\'s Pawn Game',
  'E11': 'Bogo-Indian Defence',
  'E12': 'Queen\'s Indian Defence',
  'E13': 'Queen\'s Indian Defence',
  'E14': 'Queen\'s Indian Defence',
  'E15': 'Queen\'s Indian Defence',
  'E16': 'Queen\'s Indian Defence',
  'E17': 'Queen\'s Indian Defence',
  'E18': 'Queen\'s Indian Defence',
  'E19': 'Queen\'s Indian Defence',

  // E20-E29: Nimzo-Indian Defence
  'E20': 'Nimzo-Indian Defence',
  'E21': 'Nimzo-Indian Defence, Three Knights Variation',
  'E22': 'Nimzo-Indian Defence, Spielmann Variation',
  'E23': 'Nimzo-Indian Defence, Spielmann Variation',
  'E24': 'Nimzo-Indian Defence, Spielmann Variation',
  'E25': 'Nimzo-Indian Defence, Spielmann Variation',
  'E26': 'Nimzo-Indian Defence, Spielmann Variation',
  'E27': 'Nimzo-Indian Defence, Spielmann Variation',
  'E28': 'Nimzo-Indian Defence, Spielmann Variation',
  'E29': 'Nimzo-Indian Defence, Spielmann Variation',

  // E30-E39: Nimzo-Indian Defence
  'E30': 'Nimzo-Indian Defence',
  'E31': 'Nimzo-Indian Defence, Leningrad Variation',
  'E32': 'Nimzo-Indian Defence, Classical Variation',
  'E33': 'Nimzo-Indian Defence, Classical Variation',
  'E34': 'Nimzo-Indian Defence, Classical Variation',
  'E35': 'Nimzo-Indian Defence, Classical Variation',
  'E36': 'Nimzo-Indian Defence, Classical Variation',
  'E37': 'Nimzo-Indian Defence, Classical Variation',
  'E38': 'Nimzo-Indian Defence, Classical Variation',
  'E39': 'Nimzo-Indian Defence, Classical Variation',

  // E40-E49: Nimzo-Indian Defence
  'E40': 'Nimzo-Indian Defence',
  'E41': 'Nimzo-Indian Defence, Huebner Variation',
  'E42': 'Nimzo-Indian Defence, Huebner Variation',
  'E43': 'Nimzo-Indian Defence, Fischer Variation',
  'E44': 'Nimzo-Indian Defence, Fischer Variation',
  'E45': 'Nimzo-Indian Defence, Huebner Variation',
  'E46': 'Nimzo-Indian Defence, Huebner Variation',
  'E47': 'Nimzo-Indian Defence, Huebner Variation',
  'E48': 'Nimzo-Indian Defence, Huebner Variation',
  'E49': 'Nimzo-Indian Defence, Huebner Variation',

  // E50-E59: Nimzo-Indian Defence
  'E50': 'Nimzo-Indian Defence',
  'E51': 'Nimzo-Indian Defence, Huebner Variation',
  'E52': 'Nimzo-Indian Defence, Huebner Variation',
  'E53': 'Nimzo-Indian Defence, Huebner Variation',
  'E54': 'Nimzo-Indian Defence, Huebner Variation',
  'E55': 'Nimzo-Indian Defence, Huebner Variation',
  'E56': 'Nimzo-Indian Defence, Huebner Variation',
  'E57': 'Nimzo-Indian Defence, Huebner Variation',
  'E58': 'Nimzo-Indian Defence, Huebner Variation',
  'E59': 'Nimzo-Indian Defence, Huebner Variation',

  // E60-E69: King's Indian Defence
  'E60': 'King\'s Indian Defence',
  'E61': 'King\'s Indian Defence',
  'E62': 'King\'s Indian Defence, Fianchetto Variation',
  'E63': 'King\'s Indian Defence, Fianchetto Variation',
  'E64': 'King\'s Indian Defence, Fianchetto Variation',
  'E65': 'King\'s Indian Defence, Fianchetto Variation',
  'E66': 'King\'s Indian Defence, Fianchetto Variation',
  'E67': 'King\'s Indian Defence, Fianchetto Variation',
  'E68': 'King\'s Indian Defence, Fianchetto Variation',
  'E69': 'King\'s Indian Defence, Fianchetto Variation',

  // E70-E79: King's Indian Defence
  'E70': 'King\'s Indian Defence',
  'E71': 'King\'s Indian Defence, Makagonov System',
  'E72': 'King\'s Indian Defence, Classical Variation',
  'E73': 'King\'s Indian Defence, Classical Variation',
  'E74': 'King\'s Indian Defence, Classical Variation',
  'E75': 'King\'s Indian Defence, Classical Variation',
  'E76': 'King\'s Indian Defence, Classical Variation',
  'E77': 'King\'s Indian Defence, Classical Variation',
  'E78': 'King\'s Indian Defence, Classical Variation',
  'E79': 'King\'s Indian Defence, Classical Variation',

  // E80-E89: King's Indian Defence
  'E80': 'King\'s Indian Defence, Saemisch Variation',
  'E81': 'King\'s Indian Defence, Saemisch Variation',
  'E82': 'King\'s Indian Defence, Saemisch Variation',
  'E83': 'King\'s Indian Defence, Saemisch Variation',
  'E84': 'King\'s Indian Defence, Saemisch Variation',
  'E85': 'King\'s Indian Defence, Saemisch Variation',
  'E86': 'King\'s Indian Defence, Saemisch Variation',
  'E87': 'King\'s Indian Defence, Saemisch Variation',
  'E88': 'King\'s Indian Defence, Saemisch Variation',
  'E89': 'King\'s Indian Defence, Saemisch Variation',

  // E90-E99: King's Indian Defence
  'E90': 'King\'s Indian Defence',
  'E91': 'King\'s Indian Defence',
  'E92': 'King\'s Indian Defence, Classical Variation',
  'E93': 'King\'s Indian Defence, Petrosian System',
  'E94': 'King\'s Indian Defence, Classical Variation',
  'E95': 'King\'s Indian Defence, Classical Variation',
  'E96': 'King\'s Indian Defence, Classical Variation',
  'E97': 'King\'s Indian Defence, Classical Variation',
  'E98': 'King\'s Indian Defence, Classical Variation',
  'E99': 'King\'s Indian Defence, Classical Variation'
};

// Function to get opening name from ECO code
function getOpeningName(eco) {
  if (!eco) return 'Unknown Opening';
  return ecoToNames[eco] || `ECO ${eco}`;
}

// Function to get opening name from PGN
function getOpeningNameFromPGN(pgn) {
  if (!pgn) return 'Unknown Opening';
  
  // Try to get opening name first
  const openingMatch = pgn.match(/\[Opening\s+"([^"]+)"\]/);
  if (openingMatch) {
    return openingMatch[1];
  }
  
  // Fall back to ECO code
  const ecoMatch = pgn.match(/\[ECO\s+"([A-E]\d{2})"\]/);
  if (ecoMatch) {
    return getOpeningName(ecoMatch[1]);
  }
  
  return 'Unknown Opening';
}

module.exports = {
  ecoToNames,
  getOpeningName,
  getOpeningNameFromPGN
};





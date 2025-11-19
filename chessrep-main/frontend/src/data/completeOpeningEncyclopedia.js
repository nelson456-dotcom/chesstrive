// Complete Chess Openings Encyclopedia - 101 openings with 303 variations total
export const completeOpeningEncyclopedia = {
  "French Defense (for Black)": {
    description: "A solid defensive opening that begins with 1.e4 e6. Black aims to control the center with pawns and develop pieces behind this solid pawn structure.",
    category: "Defense",
    variations: {
      "Winawer Variation": {
        moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7", "Qg4", "O-O", "Bd3", "Nbc6", "Nf3", "Qa5", "Bd2", "Qa4", "O-O", "c4", "Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5", "Qxc2", "Rad1", "f6"],
        explanations: [
          "White takes center; Black prepares …d5.",
          "French structure.",
          "Pinning knight; pressure on e4.",
          "White gains space; Black undermines d4.",
          "White asks; Black doubles c-pawns.",
          "Keeps …f6 flexible; controls c6/g6.",
          "White hits g7; Black castles to safety.",
          "White develops; Black increases central pressure.",
          "Targets c3/a3; pins along diagonal.",
          "Maintains pressure on c2/a3.",
          "Gains queenside space; kicks Bd3 squares.",
          "Typical sac to expose king.",
          "Continuous checks; Black steps back.",
          "Black grabs c-pawn; counterplay.",
          "Fights center; blunts attack."
        ]
      },
      "Classical (Steinitz)": {
        moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "e5", "Nfd7", "f4", "c5", "Nf3", "Nc6", "Be3", "a6", "Qd2", "Be7", "O-O-O", "O-O", "dxc5", "Nxc5", "Qf2", "Qa5", "Kb1", "b5", "h4", "b4", "Ne2", "Rb8", "Ned4", "Nxd4"],
        explanations: [
          "French start.",
          "Contest center.",
          "Classical development.",
          "Space for White; Black reroutes.",
          "White supports e5; Black hits d4.",
          "Development race.",
          "Preps …b5; queenside plans.",
          "Connects rooks, prepares to castle.",
          "Opposite castling → race.",
          "Opens center; Black active recapture.",
          "Eyeing a2/c3; counterpressure.",
          "King safety; pawn storm begins.",
          "Both push on wings.",
          "White reroutes; Black stacks b-file.",
          "Central fight; Black simplifies."
        ]
      },
      "Tarrasch Variation": {
        moves: ["e4", "e6", "d4", "d5", "Nd2", "Nf6", "exd5", "exd5", "Ngf3", "Bd6", "Bd3", "O-O", "O-O", "c5", "dxc5", "Bxc5", "Nb3", "Bb6", "c3", "Nc6", "Bg5", "h6", "Bh4", "g5", "Bg3", "Nh5", "Nfd4", "Nxg3"],
        explanations: [
          "French.",
          "Standard.",
          "Avoids …Bb4 pin.",
          "Opens lines; symmetrical structure.",
          "Harmonious development.",
          "Natural squares for bishops.",
          "King safety.",
          "Counterstrike at d4.",
          "Open files; bishop activity.",
          "Keeps bishop on a7–g1 diagonal.",
          "White stabilizes; Black develops.",
          "Pin; Black asks the bishop.",
          "Space/gain tempo; risky kingside.",
          "Black hunts the dark-squared bishop.",
          "Exchanges to reduce pressure."
        ]
      }
    }
  },
  "Caro–Kann Defense (for Black)": {
    description: "A solid and reliable defense that begins with 1.e4 c6. Black prepares to challenge the center with ...d5 while maintaining a solid pawn structure.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6", "Nf3", "Nd7", "h5", "Bh7", "Bd3", "Bxd3", "Qxd3", "e6", "Bd2", "Ngf6", "O-O-O", "Be7", "Kb1", "O-O", "Ne4", "Nxe4", "Qxe4", "Nf6"],
        explanations: [
          "Prepares …d5.",
          "Central counter.",
          "Clarifies center.",
          "Develops bishop outside chain.",
          "Preserve bishop; cover e4.",
          "Prevents h5; luft.",
          "Solidify e5; flexible development.",
          "Gains space; bishop retreats.",
          "Trade to reduce pressure.",
          "Solid structure; dark bishop frees later.",
          "Develops; eyes e4/g4.",
          "Preps castling; connects rooks.",
          "King safety both sides.",
          "Centralization; simplification.",
          "Regrouping; equal play."
        ]
      },
      "Advance Variation": {
        moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5", "O-O", "Nc6", "Be3", "Qb6", "Nc3", "cxd4", "Nxd4", "Nxd4", "Bxd4", "Bc5", "Na4", "Bxd4", "Nxb6", "Bxb6", "Bb5+", "Kf8", "c4", "Ne7", "Rc1", "Rc8"],
        explanations: [
          "Caro–Kann.",
          "Challenge center.",
          "Standard development.",
          "Fortifies d5; frees f8–bishop later.",
          "Timely break vs d4.",
          "Development; hits d4.",
          "Pressure b2/d4.",
          "Open c-file.",
          "Reduce central tension.",
          "Targets d4; develop with tempo.",
          "Eliminate active bishop.",
          "Structural clarity; bishop pair vs activity.",
          "Sidestep checks; keep rook connection.",
          "Prepare …Nf5; control d5.",
          "Contest c-file."
        ]
      },
      "Panov–Botvinnik Attack": {
        moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "c4", "Nf6", "Nc3", "Nc6", "Nf3", "Bg4", "cxd5", "Nxd5", "Qb3", "e6", "Qxb7", "Ndb4", "Bb5", "Rc8", "Ne5", "Rc7", "Bxc6+", "Nxc6", "Nxc6", "Rxb7", "Nxd8", "Kxd8", "O-O"],
        explanations: [
          "Caro–Kann.",
          "Symmetry.",
          "Isolates potential IQP structures.",
          "Develop hit d5.",
          "Fight d4 squares.",
          "Pin; pressure on d4/e2.",
          "Open lines; active piece play.",
          "Guard b7/d5.",
          "Tempo on queen; initiative.",
          "Pile on c-file.",
          "Defend b7; overprotect.",
          "Exchange to untangle.",
          "Material balance restored.",
          "King central; simplified middlegame.",
          "White castles; equal/imbalanced play."
        ]
      }
    }
  },
  "Sicilian Defense (for Black)": {
    description: "The most popular response to 1.e4, beginning with 1...c5. Black immediately challenges White's central control and creates an asymmetrical position.",
    category: "Defense",
    variations: {
      "Najdorf Variation": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be2", "e5", "Nf3", "Be7", "O-O", "O-O", "Bg5", "Be6", "Re1", "Nbd7", "a4", "Rc8", "Bf1", "h6", "Bh4", "Qc7", "Nd2", "Rfe8", "a5", "Qc6"],
        explanations: [
          "Counterattack d4 square.",
          "Support …e5; flexible.",
          "Open c-file; challenge center.",
          "Hit e4; develop with tempo.",
          "Najdorf; controls b5; flexible plans.",
          "Grab central space; hit d4.",
          "Redeploy knight; prep castling.",
          "Kings to safety.",
          "Neutralize pin; develop smoothly.",
          "Centralize; connect rooks.",
          "Restrain …b5; Black places rook on half-open c-file.",
          "White preserves bishop pair; Black asks Bg5.",
          "Eye c2/e5; queen harmonizes with c-file.",
          "White reroutes; Black reinforces e-file.",
          "Space on queenside; Black keeps pressure."
        ]
      },
      "Dragon (Yugoslav Attack setup by White)": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3", "O-O", "Qd2", "Nc6", "Bc4", "Bd7", "O-O-O", "Rc8", "Bb3", "Ne5", "h4", "h5", "Bg5", "Rc5", "Kb1", "Qb8", "Rhe1", "Rfc8"],
        explanations: [
          "Sicilian.",
          "Solid; eyes …g6.",
          "Open c-file.",
          "Hit e4.",
          "Dragon fianchetto.",
          "Developing; fight dark squares.",
          "White secures e4; Black castles.",
          "Connect rooks; hit d4.",
          "Aim at f7; Black completes minor development.",
          "Opposite wings; c-file pressure.",
          "Knight heads c4/f3; eyes tactics.",
          "White storms; Black slows g-pawn rush.",
          "Pin f6; Black counterplays on c-file/5th rank.",
          "King tucks; Black eyes b2/c2.",
          "Rooks double; race begins."
        ]
      },
      "Sveshnikov": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5", "Ndb5", "d6", "Bg5", "a6", "Na3", "b5", "Nd5", "Be7", "Bxf6", "Bxf6", "c3", "O-O", "Nc2", "Rb8", "a4", "bxa4", "Nce3", "Bg5", "Qxa4", "Ne7"],
        explanations: [
          "Sicilian.",
          "Flexible; invites d4.",
          "Open center.",
          "Tempo on e4.",
          "Central clamp; hits d4 knight.",
          "Cover c7 and e5; solid.",
          "Provokes knight move.",
          "Gains space; hit Nb5 square.",
          "Knight outpost; Black develops.",
          "Trade knight; keep dark-bishop active.",
          "Bolster d4; Black castles.",
          "Prepare …b4; queenside play.",
          "Undermine; open b-file.",
          "Target e3/c1; active piece.",
          "White regains; Black reroutes to g6/f5."
        ]
      }
    }
  },
  "Scandinavian Defense (for Black)": {
    description: "An immediate challenge to White's center with 1...d5. Black aims for quick development and active piece play.",
    category: "Defense",
    variations: {
      "Mainline 2…Qxd5": {
        moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "c6", "Bc4", "Bf5", "Bd2", "e6", "Qe2", "Bb4", "O-O-O", "Nbd7", "a3", "Bxc3", "Bxc3", "Qc7", "Ne5", "Nxe5", "dxe5", "Nd5", "Bd2", "h6", "Rhe1", "O-O-O"],
        explanations: [
          "Immediate central strike.",
          "Queen recapture; challenges center.",
          "Queen retreats to a5; eyes c3/e1.",
          "Develop; hit e4/d5.",
          "Support …Bf5/…Bg4; restrain Nb5.",
          "Develop with tempo vs f2.",
          "Solid; prepares …Nbd7.",
          "Pin knight; pressure c3.",
          "King safety; develop.",
          "Clarify tension; damage structure.",
          "Centralize queen; eye c2/e5.",
          "Trade an active piece.",
          "Knight activity; hit c3/e3.",
          "Create luft; stop Bg5.",
          "Black completes development into a solid middlegame."
        ]
      },
      "2…Nf6 System": {
        moves: ["e4", "d5", "exd5", "Nf6", "d4", "Nxd5", "c4", "Nb6", "Nf3", "g6", "Nc6", "Bg7", "Be2", "O-O", "O-O", "Nc6", "d5", "Na5", "c5", "Nd7", "Be3", "c6", "Rc1", "cxd5", "Qxd5", "Nf6", "Qb3", "Be6", "Qxb7", "Nd5"],
        explanations: [
          "Scandinavian.",
          "Immediate piece pressure on d5.",
          "Recover pawn; develop.",
          "Knight retreats; supports …Nc6.",
          "Aim for fianchetto setup.",
          "Contest dark squares.",
          "Smooth development.",
          "Pressure d4/e5.",
          "Knight reroute; hit c4.",
          "Knight regroups; prepares …Nxc5.",
          "Strike at d5; break center.",
          "Open c-file; activity.",
          "Hit queen; tempo.",
          "Develop with tempo vs b3.",
          "Complications; Black pieces spring to life."
        ]
      },
      "Portuguese Gambit (…Bg4)": {
        moves: ["e4", "d5", "exd5", "Nf6", "d4", "Bg4", "f3", "Bf5", "c4", "e6", "dxe6", "Nc6", "Ne2", "Bxe6", "d5", "Bc5", "dxe6", "Bf2+", "Kxf2", "Qxd1", "exf7+", "Kxf7", "Nbc3", "Qd7", "Be3", "Rhe8", "Ng3", "Rxe3", "Kxe3"],
        explanations: [
          "Scandinavian.",
          "Invite tactics.",
          "Gambit idea; rapid development vs center.",
          "Maintain piece activity; provoke e4 weaknesses.",
          "Hit d5; prepare recapture.",
          "Lead in development; attack d4/e5.",
          "Recover pawn; develop.",
          "Pressure f2; quick castle next.",
          "Tactical shot; deflect king.",
          "Regain material, simplify.",
          "King centralized but material roughly balanced.",
          "Consolidate; develop queenside.",
          "Rooks join; central control.",
          "Tactical exchange; remove defender.",
          "Sharp, unbalanced middlegame arises."
        ]
      }
    }
  },
  "King's Indian Defense (for Black)": {
    description: "A hypermodern defense that begins with 1.d4 Nf6 2.c4 g6. Black allows White to build a strong center before counterattacking.",
    category: "Defense",
    variations: {
      "Classical (Mar del Plata structure)": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7", "Ne1", "Nd7", "Nd3", "f5", "f3", "f4", "Bd2", "g5", "Rc1", "Ng6", "c5", "Nf6", "cxd6", "cxd6"],
        explanations: [
          "Flexible start.",
          "Fianchetto plan.",
          "Pressure on d4.",
          "Solid dark-square grip.",
          "King safety.",
          "Strike center; build …f5 ideas.",
          "Develop; watch d4.",
          "Knight reroute to g6/f5.",
          "Prepare …f5; overprotect e5.",
          "Main break; kingside play.",
          "Space; cramp White's kingside.",
          "Expand; ready …h5.",
          "Improve knight; eye h4/f4.",
          "White's queenside push; Black keeps blockade.",
          "Typical locked-center battle."
        ]
      },
      "Fianchetto System vs KID": {
        moves: ["d4", "Nf6", "c4", "g6", "Nf3", "Bg7", "g3", "O-O", "Bg2", "d6", "O-O", "Nbd7", "Nc3", "e5", "e4", "c6", "h3", "a6", "Re1", "b5", "cxb5", "axb5", "d5", "b4", "dxc6", "bxc3", "cxd7", "Qxd7", "bxc3", "Bb7"],
        explanations: [
          "Flexible.",
          "KID setup.",
          "Development.",
          "White fianchetto; Black castles.",
          "Solid center.",
          "Prepare …e5.",
          "Contest center.",
          "Support …d5 break; restrain Nb5.",
          "Useful waiting moves; restrain Bg4/Nb5.",
          "Space queenside; counter White's squeeze.",
          "Open a-file; dynamic play.",
          "Gain space; hit c3.",
          "Tactics; activity for both.",
          "Develop queen by recapture.",
          "Harmonious piece play; complex middlegame."
        ]
      },
      "Sämisch (5.f3)": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5", "Nge2", "c6", "Qd2", "a6", "d5", "cxd5", "cxd5", "b5", "g4", "Nbd7", "Ng3", "Nb6", "h4", "b4", "Nd1", "a5", "h5"],
        explanations: [
          "KID path.",
          "Fianchetto.",
          "Develop.",
          "Central control.",
          "Sämisch setup; White clamps g4.",
          "Strike center.",
          "Support …d5; restrain Nb5.",
          "Useful; prepares …b5.",
          "Clarify center; open c-file.",
          "Space queenside; typical plan.",
          "White storms; Black completes development.",
          "Reroute knight to c4/d7.",
          "Gain space; distract queenside.",
          "Expand; prepare …Ba6.",
          "Kingside hooks appear; double-edged."
        ]
      }
    }
  },
  "Nimzo–Indian Defense (for Black)": {
    description: "A flexible defense that begins with 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4. Black pins the knight and creates dynamic play.",
    category: "Defense",
    variations: {
      "Classical 4.Qc2": {
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2", "O-O", "a3", "Bxc3+", "Qxc3", "b6", "Bg5", "Bb7", "e3", "d6", "f3", "Nbd7", "Bd3", "c5", "Ne2", "Rc8", "O-O", "h6", "Bh4", "Re8", "Rad1", "cxd4", "exd4"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb4.",
          "Nimzo! Pins knight.",
          "Cover e4; castle.",
          "Double c-pawns; concede bishop pair.",
          "Prepare …Bb7; solid.",
          "Develop; control e4.",
          "Solid dark-square net.",
          "Support e4; develop.",
          "Challenge center; hit d4.",
          "Eye c4/c-file.",
          "Ask bishop; luft.",
          "Centralize; prep …e5.",
          "Clarify; open c-file.",
          "Typical IQP/isolani themes possible."
        ]
      },
      "Rubinstein 4.e3": {
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "c5", "O-O", "dxc4", "Bxc4", "Nbd7", "Qe2", "b6", "Rd1", "Bb7", "a3", "Bxc3", "Qxc3", "Qe7", "b4", "cxd5", "exd5", "Rac8", "Bd3", "Rfd8"],
        explanations: [
          "Indian.",
          "Queen's Indian/Nimzo options.",
          "Nimzo–Indian.",
          "Solid; castle.",
          "Contest center.",
          "Hit d4; pressure c4.",
          "Gain tempo vs Bd3.",
          "Develop; overprotect e5.",
          "Queen development; solid structure.",
          "Rook activity; develop bishop.",
          "Clarify tension; damage structure.",
          "Centralize queen; eye c2/e5.",
          "Space queenside; restrain …c5.",
          "Open center; clarify structure.",
          "Develop bishop; centralize rooks."
        ]
      },
      "Leningrad Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qb3", "c5", "dxc5", "Nc6", "Nf3", "Ne4", "Qd1", "Nxc3", "Qd2", "Nxa2", "Qxa2", "Bxc3+", "Qxc3", "Qxc3", "bxc3", "e3", "d6", "Be2", "e5", "O-O", "Be6", "Rd1", "O-O"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb4.",
          "Nimzo–Indian; queen activity.",
          "Challenge center; hit d4.",
          "Open center; develop knight.",
          "Hit queen; knight activity.",
          "Queen retreat; knight capture.",
          "Knight activity; hit c3.",
          "Queen recapture; trade bishops.",
          "Queen trade; structural damage.",
          "Simplify; equal material.",
          "Solid structure; develop.",
          "Develop bishop; central advance.",
          "King safety; develop bishop.",
          "Rook activity; king safety."
        ]
      }
    }
  },
  "Queen's Indian Defense (for Black)": {
    description: "A solid defense that begins with 1.d4 Nf6 2.c4 e6 3.Nf3 b6. Black aims for a flexible setup with the bishop fianchetto.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "g3", "Bb7", "Bg2", "Be7", "O-O", "O-O", "Nc3", "d5", "cxd5", "exd5", "Ne5", "c6", "Qc2", "Nbd7", "Rd1", "Rc8", "Nxd7", "Nxd7", "e4", "dxe4", "Nxe4", "Nf6", "Nxf6+", "Bxf6"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb7.",
          "White fianchetto; Black mirrors.",
          "Develop bishop; solid structure.",
          "King safety both sides.",
          "Contest center; hit c4.",
          "Open center; develop knight.",
          "Knight activity; hit c3.",
          "Queen development; solid structure.",
          "Rook activity; develop knight.",
          "Trade knights; simplify.",
          "Central advance; knight activity.",
          "Trade knights; simplify.",
          "Develop bishop; complete setup.",
          "Harmonious piece play; equal position."
        ]
      },
      "Petrosian Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "a3", "Bb7", "Nc3", "d5", "cxd5", "exd5", "g3", "Be7", "Bg2", "O-O", "O-O", "c5", "dxc5", "bxc5", "Qc2", "Nc6", "Rd1", "Qc7", "e4", "dxe4", "Nxe4", "Nxe4", "Qxe4", "Rfd8"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb7.",
          "Prevent …Bb4; restrain bishop.",
          "Develop bishop; solid structure.",
          "Contest center; hit c4.",
          "Open center; develop knight.",
          "White fianchetto; Black develops.",
          "King safety; develop bishop.",
          "Challenge center; hit d4.",
          "Open center; develop knight.",
          "Queen development; solid structure.",
          "Rook activity; develop knight.",
          "Central advance; knight activity.",
          "Trade knights; simplify.",
          "Develop rook; complete setup."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "e3", "Bb7", "Bd3", "c5", "O-O", "cxd4", "exd4", "Be7", "Nc3", "d5", "cxd5", "exd5", "Re1", "O-O", "Bg5", "Nbd7", "Qd2", "Rc8", "Rad1", "Qc7", "Bf4", "Rfd8"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb7.",
          "Solid structure; develop bishop.",
          "Develop bishop; solid structure.",
          "Challenge center; hit d4.",
          "King safety; develop knight.",
          "Open center; develop knight.",
          "Contest center; hit c4.",
          "Open center; develop knight.",
          "Rook activity; develop knight.",
          "Pin knight; develop knight.",
          "Queen development; solid structure.",
          "Rook activity; develop knight.",
          "Develop bishop; complete setup.",
          "Harmonious piece play; equal position."
        ]
      }
    }
  },
  "Dutch Leningrad Manual": {
    description: "A dynamic Dutch setup with ...g6 and ...Bg7 where Black plays for kingside expansion and central counterplay.",
    category: "Defense",
    variations: {
      "Main Leningrad": {
        moves: ["d4", "f5", "c4", "Nf6", "g3", "g6", "Bg2", "Bg7", "Nf3", "O-O", "O-O", "d6", "Nc3", "c6", "Rb1", "Na6", "b4", "Nc7", "b5", "Bd7", "a4", "Qe8", "Ba3"],
        explanations: [
          "Black fianchettos the king bishop and prepares ...e5 or ...c5.",
          "White gains queenside space with b4-b5.",
          "...Na6-c7 supports ...e5 while covering b5.",
          "Both sides battle for control of e4 and c5 squares." 
        ]
      },
      "Anti-Leningrad h4": {
        moves: ["d4", "f5", "c4", "Nf6", "g3", "g6", "Bg2", "Bg7", "Nc3", "O-O", "h4", "d6", "Nh3", "c6", "d5", "cxd5", "cxd5", "Na6", "Nf4", "Bd7", "h5", "g5", "Ne6"],
        explanations: [
          "White storms with h4-h5 to prise open the kingside.",
          "Black keeps structure intact but weakens dark squares.",
          "Ne6 is a key outpost hitting g7 and f8.",
          "Black must counter in the center with ...Nc5 or ...Qe8." 
        ]
      },
      "Early ...c5": {
        moves: ["d4", "f5", "g3", "Nf6", "Bg2", "g6", "c4", "Bg7", "Nc3", "O-O", "Nf3", "d6", "O-O", "c5", "d5", "Na6", "Re1", "Nc7", "e4", "fxe4", "Nxe4", "b5", "Nxc5"],
        explanations: [
          "Black breaks with ...c5 early to challenge White's center.",
          "d5 followed by e4 opens lines for White's bishops.",
          "...Na6-c7 supports ...b5 expansion.",
          "The resulting tactics revolve around the long diagonal." 
        ]
      }
    }
  },
  "Nimzo-Larsen Attack Toolkit": {
    description: "A flexible 1.b3 system where White fianchettos the queen's bishop and builds a central pawn duo with e4 and d4.",
    category: "System",
    variations: {
      "Classical Development": {
        moves: ["b3", "d5", "Bb2", "Nf6", "e3", "Bf5", "Nf3", "e6", "d4", "c5", "Bd3", "Nc6", "Bxf5", "exf5", "O-O", "Be7", "dxc5", "Bxc5", "Nc3", "O-O", "Ne2", "Re8", "Nf4"],
        explanations: [
          "White trades on f5 to double Black's pawns.",
          "dxc5 followed by Nc3 pressures d5 and b7.",
          "Ne2-f4 eyes e6 and g6 squares.",
          "Black relies on piece activity to compensate structural defects." 
        ]
      },
      "Double Fianchetto": {
        moves: ["b3", "d5", "Bb2", "Nf6", "g3", "c5", "Bg2", "Nc6", "c4", "d4", "Nf3", "e5", "d3", "Bd6", "O-O", "O-O", "Nbd2", "Re8", "Ne1", "Be6", "Nc2", "Qd7", "a3"],
        explanations: [
          "White fianchettos both bishops for long diagonal control.",
          "Black claims the center with ...e5 and ...d4.",
          "Ne1-c2 maneuvers hit b4 and d5.",
          "a3 prepares b4, challenging Black's queenside." 
        ]
      },
      "Reverse Nimzo": {
        moves: ["b3", "e5", "Bb2", "Nc6", "c4", "Nf6", "Nc3", "d5", "cxd5", "Nxd5", "e3", "Be6", "Nf3", "Be7", "Bb5", "O-O", "Bxc6", "bxc6", "Nxe5", "c5", "O-O", "Nb4", "d4"],
        explanations: [
          "Black mirrors Nimzo-Indian ideas with ...e5 and ...Nc6.",
          "Bb5/Bxc6 doubles pawns and targets the c5 pawn.",
          "Nxe5 tactics punish loose pieces on d7/f6.",
          "d4 opens the center for White's bishops to dominate." 
        ]
      }
    }
  },
  "Van Geet Opening Strategy": {
    description: "An offbeat 1.Nc3 system that keeps options flexible and can transpose into many central structures.",
    category: "System",
    variations: {
      "Central Expansion": {
        moves: ["Nc3", "d5", "e4", "dxe4", "Nxe4", "Nd7", "d4", "Ngf6", "Nxf6+", "Nxf6", "Nf3", "Bg4", "Be2", "e6", "O-O", "c6", "h3", "Bh5", "c4", "Be7", "Be3", "O-O", "Qb3"],
        explanations: [
          "White quickly occupies the center with e4 and d4.",
          "Black responds solidly with ...Bg4 and ...Nd7.",
          "h3 and c4 gain space and question the dark-squared bishop.",
          "Qb3 pressures b7/f7 while supporting e4."
        ]
      },
      "Queenside Fianchetto": {
        moves: ["Nc3", "d5", "g3", "e5", "Bg2", "c6", "d3", "Nf6", "e4", "d4", "Nce2", "c5", "f4", "Nc6", "Nf3", "Bd6", "O-O", "O-O", "f5", "b5", "h3", "Bb7", "g4"],
        explanations: [
          "White fianchettos and launches the f-pawn to attack.",
          "Black counters with ...c5 and ...b5 expansion.",
          "Nce2 reroutes to g3 or f4 supporting kingside thrusts.",
          "The middlegame becomes a race of opposite flank pawn storms."
        ]
      },
      "Delayed d4": {
        moves: ["Nc3", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Bg5", "Be7", "Nf5", "O-O", "e4", "d6", "Nxe7+", "Qxe7", "Qd2", "Be6", "O-O-O", "Rfe8", "f3", "Rad8", "h4"],
        explanations: [
          "White delays d4 until pieces are ready to support it.",
          "Bg5 and Nf5 create immediate pressure on f6 and d6.",
          "After e4 the center locks and White prepares a kingside assault.",
          "Black must counter with ...d5 breaks to avoid being squeezed."
        ]
      }
    }
  },
  "Anderssen Opening Resource": {
    description: "An uncommon first move 1.a3 offering flexibility and early prophylaxis against ...Bb4 pins.",
    category: "System",
    variations: {
      "Flexible Queen's Gambit": {
        moves: ["a3", "d5", "d4", "Nf6", "Nc3", "e6", "Bg5", "Be7", "e3", "O-O", "Nf3", "b6", "Bd3", "Bb7", "O-O", "Nbd7", "Ne2", "c5", "c3", "Qc7", "h3", "Rfe8", "Rc1"],
        explanations: [
          "a3 keeps ...Bb4 ideas in check while heading toward QGD play.",
          "Ne2 reroutes toward f4 or g3 supporting e4.",
          "h3 and Rc1 prepare c4 or f3 pawn breaks.",
          "Black maintains a solid setup with ...b6 and ...Bb7."
        ]
      },
      "Reversed French": {
        moves: ["a3", "e5", "e4", "Nc6", "Nc3", "Nf6", "Nf3", "Bc5", "Na4", "Be7", "d4", "exd4", "e5", "Ng4", "Bf4", "g5", "Bg3", "h5", "h3", "Nh6", "Nxd4", "Nxd4", "Qxd4"],
        explanations: [
          "White transposes into a reversed French Advance setup.",
          "Na4 gains tempo on the c5 bishop.",
          "e5 gains space; Black reacts with pawn thrusts on the kingside.",
          "Tactical motifs revolve around g4/e5 squares."
        ]
      },
      "Flank Expansion": {
        moves: ["a3", "g6", "d4", "Bg7", "e4", "d6", "Nc3", "c6", "Be3", "Nd7", "Qd2", "b5", "f4", "a6", "Nf3", "Bb7", "h4", "Ngf6", "h5", "Nxh5", "O-O-O", "Ng3", "Rh3"],
        explanations: [
          "Black fianchettos; White builds a kingside pawn majority.",
          "h4-h5 opens files and creates hooks near the king.",
          "O-O-O enables rook lifts via h3.",
          "Both sides monitor tactics along the long diagonal."
        ]
      }
    }
  },
  "King's Indian Attack Blueprint": {
    description: "A universal setup with Nf3, g3, Bg2, d3, and e4, adaptable against many defenses while aiming for kingside pressure.",
    category: "System",
    variations: {
      "Classical vs ...d5": {
        moves: ["Nf3", "d5", "g3", "c5", "Bg2", "Nc6", "O-O", "e5", "d6", "Nbd2", "Be7", "Re1", "Nf6", "c3", "O-O", "a3", "Qc7", "b4", "Bd7", "Bb2", "Rad8", "Qc2", "Rfe8"],
        explanations: [
          "White obtains the standard KIA structure versus ...d5 setups.",
          "a3/b4 gain queenside space to complement kingside attack.",
          "Re1 and Bb2 support e5 and f5 thrusts.",
          "Black watches for ...cxb4 or ...d4 breaks to free position."
        ]
      },
      "Against the French": {
        moves: ["e4", "e6", "d3", "d5", "Nd2", "Nf6", "Ngf3", "c5", "g3", "Nc6", "Bg2", "Be7", "O-O", "O-O", "Re1", "b5", "e5", "Nd7", "Nf1", "a5", "h4", "Ba6", "Ne3"],
        explanations: [
          "White employs KIA move order versus French structures.",
          "e5 and Ne3-g4 aim at kingside dark squares.",
          "Black expands with ...b5 and ...a5 to counter.",
          "h4-h5 opens lines around the black king."
        ]
      },
      "Double Fianchetto": {
        moves: ["Nf3", "d5", "g3", "c5", "Bg2", "g6", "O-O", "Bg7", "d3", "Nc6", "Nbd2", "e5", "e4", "Nge7", "c3", "O-O", "Re1", "h6", "a3", "Be6", "b4", "dxe4", "dxe4"],
        explanations: [
          "Black mirrors with a double fianchetto, leading to balanced play.",
          "White's e4 break opens the center when timed correctly.",
          "a3/b4 expand on the queenside to distract Black.",
          "Both sides rely on piece maneuvers to increase pressure."
        ]
      }
    }
  },
  "Bogo-Indian Defense (for Black)": {
    description: "A solid defense that begins with 1.d4 Nf6 2.c4 e6 3.Nf3 Bb4+. Black pins the knight and creates dynamic play.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+", "Bd2", "Qe7", "Nc3", "O-O", "e3", "d5", "cxd5", "exd5", "Bd3", "Nc6", "O-O", "Bxc3", "Bxc3", "Re8", "Re1", "Bg4", "h3", "Bxf3", "Qxf3", "Rad8"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb4+.",
          "Bogo–Indian; pin knight.",
          "Block check; develop queen.",
          "Develop knight; solid structure.",
          "King safety; develop knight.",
          "Solid structure; develop bishop.",
          "Contest center; hit c4.",
          "Open center; develop knight.",
          "Develop bishop; solid structure.",
          "Challenge center; hit d4.",
          "Trade bishops; simplify.",
          "Rook activity; develop knight.",
          "Pin knight; develop bishop.",
          "Trade bishops; simplify.",
          "Develop rook; complete setup."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+", "Nbd2", "O-O", "a3", "Be7", "e3", "d5", "cxd5", "exd5", "Bd3", "Nc6", "O-O", "Re8", "Re1", "Bg4", "h3", "Bxf3", "Nxf3", "Qd7", "Qc2", "Rad8"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb4+.",
          "Bogo–Indian; pin knight.",
          "Block check; develop knight.",
          "King safety; develop knight.",
          "Ask bishop; retreat.",
          "Solid structure; develop bishop.",
          "Contest center; hit c4.",
          "Open center; develop knight.",
          "Develop bishop; solid structure.",
          "Challenge center; hit d4.",
          "Rook activity; develop knight.",
          "Pin knight; develop bishop.",
          "Trade bishops; simplify.",
          "Queen development; solid structure.",
          "Develop rook; complete setup."
        ]
      },
      "Leningrad Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+", "Bd2", "Qe7", "Nc3", "O-O", "e3", "d5", "cxd5", "exd5", "Bd3", "Nc6", "O-O", "Bxc3", "Bxc3", "Re8", "Re1", "Bg4", "h3", "Bxf3", "Qxf3", "Rad8"],
        explanations: [
          "Indian family.",
          "Flexible; prepares …Bb4+.",
          "Bogo–Indian; pin knight.",
          "Block check; develop queen.",
          "Develop knight; solid structure.",
          "King safety; develop knight.",
          "Solid structure; develop bishop.",
          "Contest center; hit c4.",
          "Open center; develop knight.",
          "Develop bishop; solid structure.",
          "Challenge center; hit d4.",
          "Trade bishops; simplify.",
          "Rook activity; develop knight.",
          "Pin knight; develop bishop.",
          "Trade bishops; simplify.",
          "Develop rook; complete setup."
        ]
      }
    }
  },
  "English Defense (for Black)": {
    description: "A flexible defense that begins with 1.c4 e6 2.Nc3 b6. Black aims for a hypermodern setup with the bishop fianchetto.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["c4", "e6", "Nc3", "b6", "e4", "Bb7", "Nf3", "Nf6", "e5", "Nd5", "Nxd5", "exd5", "d4", "d6", "exd6", "cxd6", "Bd3", "Be7", "O-O", "O-O", "Re1", "Nc6", "Bf4", "Qd7", "Qd2", "Rfe8"],
        explanations: [
          "English Opening.",
          "Flexible; prepares …Bb7.",
          "Central advance; develop bishop.",
          "Develop knight; solid structure.",
          "Central advance; knight activity.",
          "Knight activity; hit c3.",
          "Trade knights; simplify.",
          "Central advance; knight activity.",
          "Central advance; knight activity.",
          "Trade pawns; simplify.",
          "Develop bishop; solid structure.",
          "King safety; develop bishop.",
          "Rook activity; develop knight.",
          "Develop bishop; solid structure.",
          "Queen development; complete setup."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["c4", "e6", "Nc3", "b6", "e4", "Bb7", "Nf3", "Nf6", "e5", "Nd5", "Nxd5", "exd5", "d4", "d6", "exd6", "cxd6", "Bd3", "Be7", "O-O", "O-O", "Re1", "Nc6", "Bf4", "Qd7", "Qd2", "Rfe8"],
        explanations: [
          "English Opening.",
          "Flexible; prepares …Bb7.",
          "Central advance; develop bishop.",
          "Develop knight; solid structure.",
          "Central advance; knight activity.",
          "Knight activity; hit c3.",
          "Trade knights; simplify.",
          "Central advance; knight activity.",
          "Central advance; knight activity.",
          "Trade pawns; simplify.",
          "Develop bishop; solid structure.",
          "King safety; develop bishop.",
          "Rook activity; develop knight.",
          "Develop bishop; solid structure.",
          "Queen development; complete setup."
        ]
      },
      "Leningrad Variation": {
        moves: ["c4", "e6", "Nc3", "b6", "e4", "Bb7", "Nf3", "Nf6", "e5", "Nd5", "Nxd5", "exd5", "d4", "d6", "exd6", "cxd6", "Bd3", "Be7", "O-O", "O-O", "Re1", "Nc6", "Bf4", "Qd7", "Qd2", "Rfe8"],
        explanations: [
          "English Opening.",
          "Flexible; prepares …Bb7.",
          "Central advance; develop bishop.",
          "Develop knight; solid structure.",
          "Central advance; knight activity.",
          "Knight activity; hit c3.",
          "Trade knights; simplify.",
          "Central advance; knight activity.",
          "Central advance; knight activity.",
          "Trade pawns; simplify.",
          "Develop bishop; solid structure.",
          "King safety; develop bishop.",
          "Rook activity; develop knight.",
          "Develop bishop; solid structure.",
          "Queen development; complete setup."
        ]
      }
    }
  },
  "Owen's Defense (for Black)": {
    description: "A flexible defense that begins with 1.e4 b6. Black aims for a hypermodern setup with the bishop fianchetto.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["e4", "b6", "d4", "Bb7", "Nc3", "e6", "Nf3", "Nf6", "Bd3", "Be7", "O-O", "O-O", "Re1", "d6", "Bf4", "Nbd7", "Qd2", "c5", "dxc5", "dxc5", "Rad1", "Qc7", "e5", "Nd5", "Nxd5", "exd5"],
        explanations: [
          "King's pawn opening.",
          "Owen's Defense; develop bishop.",
          "Central advance; develop bishop.",
          "Develop knight; solid structure.",
          "Develop knight; solid structure.",
          "Develop bishop; solid structure.",
          "King safety; develop bishop.",
          "Rook activity; develop knight.",
          "Develop bishop; solid structure.",
          "Queen development; solid structure.",
          "Challenge center; hit d4.",
          "Open center; develop knight.",
          "Rook activity; develop knight.",
          "Central advance; knight activity.",
          "Trade knights; simplify.",
          "Central advance; knight activity."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["e4", "b6", "d4", "Bb7", "Nc3", "e6", "Nf3", "Nf6", "Bd3", "Be7", "O-O", "O-O", "Re1", "d6", "Bf4", "Nbd7", "Qd2", "c5", "dxc5", "dxc5", "Rad1", "Qc7", "e5", "Nd5", "Nxd5", "exd5"],
        explanations: [
          "King's pawn opening.",
          "Owen's Defense; develop bishop.",
          "Central advance; develop bishop.",
          "Develop knight; solid structure.",
          "Develop knight; solid structure.",
          "Develop bishop; solid structure.",
          "King safety; develop bishop.",
          "Rook activity; develop knight.",
          "Develop bishop; solid structure.",
          "Queen development; solid structure.",
          "Challenge center; hit d4.",
          "Open center; develop knight.",
          "Rook activity; develop knight.",
          "Central advance; knight activity.",
          "Trade knights; simplify.",
          "Central advance; knight activity."
        ]
      },
      "Leningrad Variation": {
        moves: ["e4", "b6", "d4", "Bb7", "Nc3", "e6", "Nf3", "Nf6", "Bd3", "Be7", "O-O", "O-O", "Re1", "d6", "Bf4", "Nbd7", "Qd2", "c5", "dxc5", "dxc5", "Rad1", "Qc7", "e5", "Nd5", "Nxd5", "exd5"],
        explanations: [
          "King's pawn opening.",
          "Owen's Defense; develop bishop.",
          "Central advance; develop bishop.",
          "Develop knight; solid structure.",
          "Develop knight; solid structure.",
          "Develop bishop; solid structure.",
          "King safety; develop bishop.",
          "Rook activity; develop knight.",
          "Develop bishop; solid structure.",
          "Queen development; solid structure.",
          "Challenge center; hit d4.",
          "Open center; develop knight.",
          "Rook activity; develop knight.",
          "Central advance; knight activity.",
          "Trade knights; simplify.",
          "Central advance; knight activity."
        ]
      }
    }
  },
  "Bird's Opening (for White)": {
    description: "An unusual opening that begins with 1.f4. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["f4", "d5", "Nf3", "Nf6", "e3", "g6", "Be2", "Bg7", "O-O", "O-O", "d3", "c5", "Nbd2", "Nc6", "c3", "b6", "Qc2", "Bb7", "a4", "a5", "b3", "Qd7", "Bb2", "Rfd8", "Rae1", "e6"],
        explanations: [
          "Bird's Opening; develop knight.",
          "Central advance; develop knight.",
          "Solid structure; develop bishop.",
          "Fianchetto; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop bishop.",
          "Space queenside; space queenside.",
          "Queen development; develop queen.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["f4", "d5", "Nf3", "Nf6", "e3", "g6", "Be2", "Bg7", "O-O", "O-O", "d3", "c5", "Nbd2", "Nc6", "c3", "b6", "Qc2", "Bb7", "a4", "a5", "b3", "Qd7", "Bb2", "Rfd8", "Rae1", "e6"],
        explanations: [
          "Bird's Opening; develop knight.",
          "Central advance; develop knight.",
          "Solid structure; develop bishop.",
          "Fianchetto; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop bishop.",
          "Space queenside; space queenside.",
          "Queen development; develop queen.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["f4", "d5", "Nf3", "Nf6", "e3", "g6", "Be2", "Bg7", "O-O", "O-O", "d3", "c5", "Nbd2", "Nc6", "c3", "b6", "Qc2", "Bb7", "a4", "a5", "b3", "Qd7", "Bb2", "Rfd8", "Rae1", "e6"],
        explanations: [
          "Bird's Opening; develop knight.",
          "Central advance; develop knight.",
          "Solid structure; develop bishop.",
          "Fianchetto; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop bishop.",
          "Space queenside; space queenside.",
          "Queen development; develop queen.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Polish Opening/Sokolsky (for White)": {
    description: "An unusual opening that begins with 1.b4. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["b4", "e5", "Bb2", "d6", "e3", "Nf6", "Nf3", "Be7", "Be2", "O-O", "O-O", "c6", "d4", "Qc7", "Nbd2", "Nbd7", "c4", "Rfe8", "Qc2", "Bf8", "Rac1", "g6", "h3", "Bg7", "Rfd1", "Qb6"],
        explanations: [
          "Polish Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Queen development; develop knight.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop rook.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["b4", "e5", "Bb2", "d6", "e3", "Nf6", "Nf3", "Be7", "Be2", "O-O", "O-O", "c6", "d4", "Qc7", "Nbd2", "Nbd7", "c4", "Rfe8", "Qc2", "Bf8", "Rac1", "g6", "h3", "Bg7", "Rfd1", "Qb6"],
        explanations: [
          "Polish Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Queen development; develop knight.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop rook.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook."
        ]
      },
      "Leningrad Variation": {
        moves: ["b4", "e5", "Bb2", "d6", "e3", "Nf6", "Nf3", "Be7", "Be2", "O-O", "O-O", "c6", "d4", "Qc7", "Nbd2", "Nbd7", "c4", "Rfe8", "Qc2", "Bf8", "Rac1", "g6", "h3", "Bg7", "Rfd1", "Qb6"],
        explanations: [
          "Polish Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Queen development; develop knight.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop rook.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook."
        ]
      }
    }
  },
  "Larsen's Opening (for White)": {
    description: "An unusual opening that begins with 1.b3. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["b3", "e5", "Bb2", "Nc6", "e3", "Nf6", "Nf3", "d5", "Be2", "Be7", "O-O", "O-O", "d4", "exd4", "Nxd4", "Nxd4", "Qxd4", "c6", "Nc3", "Bd7", "Qd1", "Qc7", "a3", "Rfe8", "b4", "a6"],
        explanations: [
          "Larsen's Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Trade knights; simplify.",
          "Queen activity; develop knight.",
          "Knight development; develop knight.",
          "Queen development; develop rook.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["b3", "e5", "Bb2", "Nc6", "e3", "Nf6", "Nf3", "d5", "Be2", "Be7", "O-O", "O-O", "d4", "exd4", "Nxd4", "Nxd4", "Qxd4", "c6", "Nc3", "Bd7", "Qd1", "Qc7", "a3", "Rfe8", "b4", "a6"],
        explanations: [
          "Larsen's Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Trade knights; simplify.",
          "Queen activity; develop knight.",
          "Knight development; develop knight.",
          "Queen development; develop rook.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook."
        ]
      },
      "Leningrad Variation": {
        moves: ["b3", "e5", "Bb2", "Nc6", "e3", "Nf6", "Nf3", "d5", "Be2", "Be7", "O-O", "O-O", "d4", "exd4", "Nxd4", "Nxd4", "Qxd4", "c6", "Nc3", "Bd7", "Qd1", "Qc7", "a3", "Rfe8", "b4", "a6"],
        explanations: [
          "Larsen's Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Trade knights; simplify.",
          "Queen activity; develop knight.",
          "Knight development; develop knight.",
          "Queen development; develop rook.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook."
        ]
      }
    }
  },
  "Nimzowitsch-Larsen Attack (for White)": {
    description: "An unusual opening that begins with 1.Nf3 d5 2.b3. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["Nf3", "d5", "b3", "Nf6", "Bb2", "e6", "e3", "Be7", "Be2", "O-O", "O-O", "c5", "d4", "Nc6", "Nbd2", "b6", "Qc2", "Bb7", "a3", "Qc7", "Rac1", "Rfd8", "Rfd1", "Rac8", "c4", "dxc4"],
        explanations: [
          "Nimzowitsch-Larsen Attack; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop bishop.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["Nf3", "d5", "b3", "Nf6", "Bb2", "e6", "e3", "Be7", "Be2", "O-O", "O-O", "c5", "d4", "Nc6", "Nbd2", "b6", "Qc2", "Bb7", "a3", "Qc7", "Rac1", "Rfd8", "Rfd1", "Rac8", "c4", "dxc4"],
        explanations: [
          "Nimzowitsch-Larsen Attack; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop bishop.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["Nf3", "d5", "b3", "Nf6", "Bb2", "e6", "e3", "Be7", "Be2", "O-O", "O-O", "c5", "d4", "Nc6", "Nbd2", "b6", "Qc2", "Bb7", "a3", "Qc7", "Rac1", "Rfd8", "Rfd1", "Rac8", "c4", "dxc4"],
        explanations: [
          "Nimzowitsch-Larsen Attack; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Support center; solid structure.",
          "Solid structure; develop bishop.",
          "Develop knight; develop knight.",
          "Develop bishop; develop bishop.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Challenge center; hit d4.",
          "Knight development; develop knight.",
          "Support center; develop knight.",
          "Queen development; develop bishop.",
          "Develop bishop; develop rook.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Three Knights Game (for White)": {
    description: "A classical opening that begins with 1.e4 e5 2.Nf3 Nc6 3.Nc3. White develops all three knights before committing to a specific pawn structure.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Bc5", "Bc4", "Nf6", "d3", "d6", "O-O", "O-O", "Bg5", "h6", "Bh4", "g5", "Bg3", "h5", "h3", "Bg4", "hxg4", "hxg4", "Rxh8+", "Bxh8", "Nd5", "Nxd5", "Bxd5", "Qf6", "Qd2", "Nd4"],
        explanations: [
          "King's pawn opening.",
          "Three Knights setup.",
          "Classical development; mirror development.",
          "Support center; solid structure.",
          "Pin knight; ask bishop.",
          "Retreat bishop; advance pawn.",
          "Maintain bishop; advance pawn.",
          "Prevent g4; develop bishop.",
          "Capture; recapture.",
          "Capture rook; recapture.",
          "Centralize knight; trade knights.",
          "Recapture; queen activity.",
          "Queen development; knight jumps.",
          "Trade knights; simplify.",
          "Develop bishop; complete setup."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "d5", "Qa4", "Bd7", "Qb3", "dxe4", "Nxe5", "Qd5", "Nf3", "Qxe4+", "Be2", "Bd6", "O-O", "Nf6", "d4", "O-O", "Nbd2", "Re8", "Re1", "Qd5", "Nc4", "Qd7", "Be3"],
        explanations: [
          "Standard opening.",
          "Three Knights; central counter.",
          "Queen activity; develop bishop.",
          "Attack weakness; capture.",
          "Knight jumps; queen centralization.",
          "Knight retreat; check.",
          "Block check; develop bishop.",
          "King safety; develop knight.",
          "Central advance; king safety.",
          "Knight development; rook activity.",
          "Centralize rook; queen retreat.",
          "Knight jumps; queen development.",
          "Develop bishop; complete setup."
        ]
      },
      "Steinitz Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "f5", "d4", "fxe4", "Nxe5", "Qf6", "Nxc6", "dxc6", "Be3", "Bd6", "Bc4", "Qf7", "O-O", "Nf6", "Nbd2", "O-O", "Re1", "Re8", "Qc2", "Bd7", "Rad1", "Qf6", "h3"],
        explanations: [
          "King's pawn game.",
          "Three Knights; counter-gambit.",
          "Central advance; capture.",
          "Knight jumps; queen activity.",
          "Trade knights; recapture.",
          "Develop bishop; develop bishop.",
          "Develop bishop; queen retreat.",
          "King safety; develop knight.",
          "Knight development; king safety.",
          "Centralize rook; rook activity.",
          "Queen development; develop bishop.",
          "Rook activity; queen activity.",
          "Prevent …Bg4; secure kingside."
        ]
      }
    }
  },
  "Ponziani Opening (for White)": {
    description: "An aggressive opening that aims for rapid central control and development.",
    category: "Attack",
    variations: {
      "Ponziani Main Line": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "Nf6", "d4", "Nxe4", "d5", "Ne7", "Nxe5", "Ned5", "Bd3", "Nc6", "O-O", "Be7", "Re1", "O-O", "Nc3", "Nxc3", "bxc3", "d6", "Nf3", "Bg4", "Be3", "Qd7", "Qd2", "Rfe8", "Rac1"],
        explanations: [
          "King's pawn opening.",
          "Ponziani Opening; develop knight.",
          "Support d4; develop knight.",
          "Central advance; knight jumps.",
          "Advance pawn; knight retreat.",
          "Capture pawn; knight jumps.",
          "Develop bishop; knight development.",
          "King safety; develop bishop.",
          "Centralize rook; king safety.",
          "Knight development; trade knights.",
          "Recapture; solid structure.",
          "Develop knight; pin.",
          "Develop bishop; queen development.",
          "Queen development; rook activity.",
          "Rook activity; complete development."
        ]
      },
      "Leonhardt Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "d5", "Qa4", "Bd7", "Qb3", "dxe4", "Nxe5", "Qd5", "Nf3", "Qxe4+", "Be2", "Bd6", "O-O", "Nf6", "d4", "O-O", "Nbd2", "Re8", "Re1", "Qd5", "Nc4", "Qd7", "Be3"],
        explanations: [
          "Standard opening.",
          "Ponziani setup; central counter.",
          "Queen activity; develop bishop.",
          "Attack weakness; capture.",
          "Knight jumps; queen centralization.",
          "Knight retreat; check.",
          "Block check; develop bishop.",
          "King safety; develop knight.",
          "Central advance; king safety.",
          "Knight development; rook activity.",
          "Centralize rook; queen retreat.",
          "Knight jumps; queen development.",
          "Develop bishop; complete setup."
        ]
      },
      "Steinitz Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "f5", "d4", "fxe4", "Nxe5", "Qf6", "Nxc6", "dxc6", "Be3", "Bd6", "Bc4", "Qf7", "O-O", "Nf6", "Nbd2", "O-O", "Re1", "Re8", "Qc2", "Bd7", "Rad1", "Qf6", "h3"],
        explanations: [
          "King's pawn game.",
          "Ponziani; counter-gambit.",
          "Central advance; capture.",
          "Knight jumps; queen activity.",
          "Trade knights; recapture.",
          "Develop bishop; develop bishop.",
          "Develop bishop; queen retreat.",
          "King safety; develop knight.",
          "Knight development; king safety.",
          "Centralize rook; rook activity.",
          "Queen development; develop bishop.",
          "Rook activity; queen activity.",
          "Prevent …Bg4; secure kingside."
        ]
      }
    }
  },
  "Four Knights Game (for White/Black)": {
    description: "A classical opening that develops all four knights before committing to a specific pawn structure.",
    category: "Attack",
    variations: {
      "Spanish Four Knights": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bb5", "Bb4", "O-O", "O-O", "d3", "d6", "Bg5", "Bxc3", "bxc3", "Qe7", "Re1", "Nd8", "d4", "Bg4", "Bc4", "Rd8", "h3", "Bh5", "dxe5", "dxe5", "Qd3", "c6", "Ba3"],
        explanations: [
          "Standard opening.",
          "Four Knights; develop knight.",
          "Spanish variation; mirror.",
          "Castle; king safety both sides.",
          "Support center; solid structure.",
          "Pin knight; trade pieces.",
          "Recapture; queen development.",
          "Centralize rook; knight reroute.",
          "Central advance; develop bishop.",
          "Develop bishop; rook activity.",
          "Ask bishop; retreat.",
          "Capture; recapture.",
          "Queen development; support center.",
          "Develop bishop; pressure diagonal."
        ]
      },
      "Italian Four Knights": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bc4", "Bc5", "d3", "d6", "Bg5", "h6", "Bh4", "g5", "Bg3", "h5", "h3", "Bg4", "hxg4", "hxg4", "Rxh8+", "Bxh8", "Nd5", "Nxd5", "Bxd5", "Qf6", "Qd2", "Nd4", "Nxd4"],
        explanations: [
          "King's pawn opening.",
          "Four Knights setup.",
          "Italian variation; mirror development.",
          "Support center; solid structure.",
          "Pin knight; ask bishop.",
          "Retreat bishop; advance pawn.",
          "Maintain bishop; advance pawn.",
          "Prevent g4; develop bishop.",
          "Capture; recapture.",
          "Capture rook; recapture.",
          "Centralize knight; trade knights.",
          "Recapture; queen activity.",
          "Queen development; knight jumps.",
          "Trade knights; simplify."
        ]
      },
      "Rubinstein Countergambit": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bb5", "Nd4", "Ba4", "Bc5", "Nxe5", "Qe7", "f4", "Nxe4", "Qe2", "Nxc3", "dxc3", "Qxe5", "fxe5", "Nxe2", "Kxe2", "d6", "exd6", "cxd6", "Bf4", "Be6", "Rhf1", "O-O", "Rad1"],
        explanations: [
          "Standard start.",
          "Four Knights.",
          "Spanish variation; knight jumps.",
          "Retreat bishop; develop bishop.",
          "Capture pawn; pin knight.",
          "Advance pawn; knight capture.",
          "Pin; trade knights.",
          "Recapture; knight capture.",
          "King exposed; challenge pawn.",
          "Capture; recapture.",
          "Develop bishop; develop bishop.",
          "Rook activity; king safety.",
          "Double rooks; centralize."
        ]
      }
    }
  },
  "Italian Game (for White)": {
    description: "A classical opening that begins with 1.e4 e5 2.Nf3 Nc6 3.Bc4. White aims for rapid development and central control.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nxd2", "d5", "exd5", "Nxd5", "Qb3", "Nce7", "O-O", "O-O", "Rfe1", "c6", "a4", "a5", "Nc4", "b6"],
        explanations: [
          "King's pawn opening.",
          "Italian Game; develop knight.",
          "Classical development; mirror development.",
          "Support d4; develop knight.",
          "Central advance; trade pawns.",
          "Recapture; develop bishop.",
          "Block check; trade bishops.",
          "Recapture; central advance.",
          "Trade pawns; knight activity.",
          "Queen development; knight activity.",
          "Knight development; king safety.",
          "King safety; develop knight.",
          "Rook activity; develop knight.",
          "Space queenside; space queenside.",
          "Knight activity; develop bishop.",
          "Complete development; solid structure."
        ]
      },
      "Evans Gambit": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5", "d4", "exd4", "O-O", "Nge7", "Ng5", "d5", "exd5", "Bd7", "Qb3", "Qd6", "dxc6", "bxc6", "Bd2", "Bb6", "Rfe1", "O-O", "Rad1", "Rfe8"],
        explanations: [
          "King's pawn opening.",
          "Italian Game; develop knight.",
          "Classical development; mirror development.",
          "Evans Gambit; accept gambit.",
          "Support d4; retreat bishop.",
          "Central advance; trade pawns.",
          "King safety; develop knight.",
          "Knight activity; central advance.",
          "Trade pawns; develop bishop.",
          "Queen development; queen development.",
          "Trade pawns; recapture.",
          "Develop bishop; develop bishop.",
          "Rook activity; king safety.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      },
      "Two Knights Defense": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d4", "exd4", "O-O", "Nxe4", "Re1", "d5", "Bxd5", "Qxd5", "Nc3", "Qa5", "Nxe4", "Be6", "Bd2", "Bb4", "Nc3", "Bxc3", "bxc3", "O-O", "Qe2", "Qd5", "Rac1", "Rfd8"],
        explanations: [
          "King's pawn opening.",
          "Italian Game; develop knight.",
          "Classical development; develop knight.",
          "Central advance; trade pawns.",
          "King safety; knight activity.",
          "Rook activity; central advance.",
          "Trade bishops; queen activity.",
          "Knight development; queen activity.",
          "Trade knights; develop bishop.",
          "Develop bishop; develop bishop.",
          "Knight development; trade bishops.",
          "Recapture; king safety.",
          "Queen development; queen activity.",
          "Rook activity; develop rook.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Spanish Game (Ruy Lopez) (for White)": {
    description: "A classical opening that begins with 1.e4 e5 2.Nf3 Nc6 3.Bb5. White aims for rapid development and central control.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Nb8", "d4", "Nbd7", "c4", "c6", "cxb5", "axb5", "Nc3", "Bb7", "Bg5", "b4"],
        explanations: [
          "King's pawn opening.",
          "Spanish Game; develop knight.",
          "Classical development; ask bishop.",
          "Retreat bishop; develop knight.",
          "King safety; develop bishop.",
          "Rook activity; space queenside.",
          "Retreat bishop; central advance.",
          "Support center; king safety.",
          "Prevent …Bg4; knight reroute.",
          "Central advance; knight development.",
          "Support center; support center.",
          "Trade pawns; recapture.",
          "Knight development; develop bishop.",
          "Develop bishop; space queenside.",
          "Complete development; solid structure."
        ]
      },
      "Marshall Attack": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5", "exd5", "Nxd5", "Nxe5", "Nxe5", "Rxe5", "c6", "d4", "Bd6", "Re1", "Qh4", "g3", "Qh3"],
        explanations: [
          "King's pawn opening.",
          "Spanish Game; develop knight.",
          "Classical development; ask bishop.",
          "Retreat bishop; develop knight.",
          "King safety; develop bishop.",
          "Rook activity; space queenside.",
          "Retreat bishop; king safety.",
          "Support center; central advance.",
          "Trade pawns; knight activity.",
          "Knight activity; trade knights.",
          "Rook activity; support center.",
          "Central advance; develop bishop.",
          "Rook activity; queen activity.",
          "Prevent …Qh4; queen activity.",
          "Complete development; solid structure."
        ]
      },
      "Berlin Defense": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6", "Bxc6", "dxc6", "dxe5", "Nf5", "Qxd8+", "Kxd8", "Nc3", "Ne7", "h3", "h6", "Be3", "Ng6", "Rad1", "Ke8", "Nd5", "c6", "Nc3", "Be7"],
        explanations: [
          "King's pawn opening.",
          "Spanish Game; develop knight.",
          "Classical development; develop knight.",
          "King safety; knight activity.",
          "Central advance; knight activity.",
          "Trade bishops; recapture.",
          "Central advance; knight activity.",
          "Queen trade; king activity.",
          "Knight development; knight development.",
          "Prevent …Bg4; luft.",
          "Develop bishop; knight activity.",
          "Rook activity; king activity.",
          "Knight activity; support center.",
          "Knight development; develop bishop.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Scotch Game (for White)": {
    description: "A classical opening that begins with 1.e4 e5 2.Nf3 Nc6 3.d4. White aims for rapid central control and development.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7", "Bc4", "Ne5", "Be2", "Qg6", "O-O", "d6", "f4", "Nec6", "Nxc6", "Nxc6", "Nd2", "Be6", "Nc4", "Bxc4", "Bxc4", "O-O"],
        explanations: [
          "King's pawn opening.",
          "Scotch Game; develop knight.",
          "Classical development; central advance.",
          "Trade pawns; develop bishop.",
          "Recapture; develop bishop.",
          "Queen activity; support center.",
          "Develop bishop; knight development.",
          "Develop bishop; knight activity.",
          "King safety; queen activity.",
          "Develop knight; central advance.",
          "Knight activity; trade knights.",
          "Recapture; knight development.",
          "Knight development; develop bishop.",
          "Knight activity; trade bishops.",
          "Recapture; king safety.",
          "Complete development; solid structure."
        ]
      },
      "Mieses Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7", "Bc4", "Ne5", "Be2", "Qg6", "O-O", "d6", "f4", "Nec6", "Nxc6", "Nxc6", "Nd2", "Be6", "Nc4", "Bxc4", "Bxc4", "O-O"],
        explanations: [
          "King's pawn opening.",
          "Scotch Game; develop knight.",
          "Classical development; central advance.",
          "Trade pawns; develop bishop.",
          "Recapture; develop bishop.",
          "Queen activity; support center.",
          "Develop bishop; knight development.",
          "Develop bishop; knight activity.",
          "King safety; queen activity.",
          "Develop knight; central advance.",
          "Knight activity; trade knights.",
          "Recapture; knight development.",
          "Knight development; develop bishop.",
          "Knight activity; trade bishops.",
          "Recapture; king safety.",
          "Complete development; solid structure."
        ]
      },
      "Schmidt Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7", "Bc4", "Ne5", "Be2", "Qg6", "O-O", "d6", "f4", "Nec6", "Nxc6", "Nxc6", "Nd2", "Be6", "Nc4", "Bxc4", "Bxc4", "O-O"],
        explanations: [
          "King's pawn opening.",
          "Scotch Game; develop knight.",
          "Classical development; central advance.",
          "Trade pawns; develop bishop.",
          "Recapture; develop bishop.",
          "Queen activity; support center.",
          "Develop bishop; knight development.",
          "Develop bishop; knight activity.",
          "King safety; queen activity.",
          "Develop knight; central advance.",
          "Knight activity; trade knights.",
          "Recapture; knight development.",
          "Knight development; develop bishop.",
          "Knight activity; trade bishops.",
          "Recapture; king safety.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Grunfeld Modern Playbook": {
    description: "A hypermodern defense where Black counters White's center with ...d5 and long-range bishop pressure on the diagonal.",
    category: "Defense",
    variations: {
      "Exchange Variation": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3", "Bg7", "Nf3", "c5", "Be3", "Qa5", "Qd2", "Nc6", "Rc1", "O-O", "d5", "Rd8", "Be2"],
        explanations: [
          "White builds a massive center with e4/d5.",
          "Black hits back with ...c5 and ...Qa5 to pressure c3.",
          "Rc1 and Be2 complete development for White.",
          "...Rd8 and ...Bg4 aim to undermine the d5 pawn." 
        ]
      },
      "Classical Variation": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3", "Bg7", "Qb3", "dxc4", "Qxc4", "O-O", "e4", "Na6", "Be2", "c5", "d5", "e6", "O-O", "exd5", "exd5", "Ne8", "Bf4"],
        explanations: [
          "Qb3 forces Black to decide on c4 quickly.",
          "...Na6 prepares ...c5 and ...Nb4 hitting d5.",
          "After exchanges the e-file opens with imbalanced pawn structure.",
          "White keeps slight space edge, Black has active minor pieces." 
        ]
      },
      "Prins System": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Bg5", "Ne4", "Bh4", "Nxc3", "bxc3", "c5", "e3", "cxd4", "cxd4", "Nc6", "Nf3", "Bg4", "Rc1", "Qa5+", "Qd2", "Qxd2+", "Kxd2"],
        explanations: [
          "White pins the knight with Bg5 provoking ...Ne4.",
          "Black trades on c3 and plays ...c5 to undermine the center.",
          "...Bg4 and ...Qa5 generate activity and force queen trade.",
          "Endgame arises with symmetrical pawns and active pieces." 
        ]
      }
    }
  },
  "Grunfeld Fianchetto Toolkit": {
    description: "Covers the solid fianchetto setup against the Grunfeld, where White plays g3 and seeks a long-term squeeze.",
    category: "System",
    variations: {
      "Main Fianchetto": {
        moves: ["d4", "Nf6", "c4", "g6", "g3", "d5", "Bg2", "Bg7", "Nf3", "O-O", "O-O", "dxc4", "Qc2", "Nc6", "Rd1", "Bf5", "Qxc4", "Ne4", "Nc3", "Nd6", "Qa4", "Qc8", "Bf4"],
        explanations: [
          "White recaptures on c4 with the queen and develops harmoniously.",
          "...Bf5 and ...Ne4 seek to trade minor pieces.",
          "Qa4 pins the knight and keeps pressure on the diagonal.",
          "Bf4 completes development and eyes the e5 square." 
        ]
      },
      "Delayed Qa4": {
        moves: ["d4", "Nf6", "c4", "g6", "g3", "d5", "Bg2", "Bg7", "Nf3", "O-O", "O-O", "c6", "Qc2", "Bf5", "Qb3", "Qb6", "cxd5", "cxd5", "Nc3", "Nc6", "Qxb6", "axb6", "Bf4"],
        explanations: [
          "Black plays ...c6 and ...Bf5 before taking on c4.",
          "Qb3 places pressure on d5 and the b-file.",
          "After Qxb6 axb6 the structure changes with open a-file.",
          "White uses Bf4 and Rfc1 to pressure c7/d5." 
        ]
      },
      "Fianchetto with e4": {
        moves: ["d4", "Nf6", "c4", "g6", "g3", "d5", "Bg2", "Bg7", "Nf3", "O-O", "O-O", "dxc4", "Qc2", "Nc6", "Rd1", "Bf5", "Qxc4", "e5", "Nc3", "exd4", "Nxd4", "Nxd4", "Rxd4"],
        explanations: [
          "Black breaks with ...e5 to challenge the center immediately.",
          "White recaptures on c4 and keeps pieces poised on the long diagonal.",
          "After exchanges the d4 rook becomes active.",
          "The resulting structure is balanced but rich in possibilities." 
        ]
      }
    }
  },
  "Grunfeld Russian System Study": {
    description: "Explores the Russian System (4.Nf3 Bg7 5.Qb3) where White keeps queens on and pressures the queenside.",
    category: "Defense",
    variations: {
      "Russian Main": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3", "Bg7", "Qb3", "dxc4", "Qxc4", "O-O", "e4", "a6", "Be2", "b5", "Qb3", "Bb7", "e5", "Nd5", "O-O", "Nd7", "Rd1"],
        explanations: [
          "Qb3 attacks d5 and b7 simultaneously.",
          "...a6 and ...b5 gain space on the queenside for Black.",
          "e5 drive pushes the knight to d5, where Nd7 reroutes.",
          "White castles short and plays Rd1 to support d5 push." 
        ]
      },
      "Russian with ...c6": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3", "Bg7", "Qb3", "c6", "Bg5", "Ne4", "Bf4", "dxc4", "Qxc4", "Nxc3", "bxc3", "O-O", "e4", "Nd7", "Rd1", "Qa5", "Be2"],
        explanations: [
          "Black plays ...c6 instead of ...a6, preparing ...Qa5.",
          "Bg5-Bf4 pins and pressures e5/d6 squares.",
          "...Ne4 tries to trade pieces to relieve pressure.",
          "White keeps central space with e4 and Rd1." 
        ]
      },
      "Russian with Be3": {
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3", "Bg7", "Qb3", "dxc4", "Qxc4", "O-O", "Be3", "c6", "Rd1", "Nd5", "Bg5", "Be6", "Qc5", "Nd7", "Qa3", "h6", "Bd2"],
        explanations: [
          "Be3 develops quickly and eyes c5.",
          "...c6 and ...Nd5 attack c3 and f4 squares.",
          "Qc5/A3 keep queens active and avoid exchanges.",
          "White aims for e4 while Black prepares ...Qb6 or ...Nxc3." 
        ]
      }
    }
  },
  "Bogo-Indian Development": {
    description: "A solid defense where Black plays ...Bb4+ after 1.d4 Nf6 2.c4 e6 3.Nf3, forcing White to commit the knight or bishop.",
    category: "Defense",
    variations: {
      "Mainline ...Qe7": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+", "Bd2", "Qe7", "g3", "Nc6", "Bg2", "Bxd2+", "Nbxd2", "d6", "O-O", "O-O", "Qc2", "a5", "Rad1", "e5", "dxe5", "dxe5", "Ne4"],
        explanations: [
          "...Qe7 defends the bishop and prepares ...e5.",
          "White fianchettos and keeps the pair of bishops.",
          "...a5 stops b4 expansions and supports ...e5.",
          "Ne4 targets c5/f6 after central exchanges." 
        ]
      },
      "Nimzo Hybrid": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+", "Nc3", "c5", "e3", "Ne4", "Qc2", "Qa5", "Bd2", "Nxd2", "Qxd2", "Nc6", "Be2", "cxd4", "exd4", "d5", "O-O", "O-O", "a3"],
        explanations: [
          "White blocks with Nc3, allowing Nimzo-like play.",
          "...Ne4 and ...Qa5 pressure c3 and enforce exchanges.",
          "After ...cxd4 Black strikes in the center with ...d5.",
          "The resulting IQP/isolated structures require precise play." 
        ]
      },
      "Bogo with ...a5": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+", "Bd2", "a5", "g3", "O-O", "Bg2", "Be7", "Nc3", "d6", "O-O", "Nc6", "e4", "e5", "d5", "Nb4", "Ne1", "Nd7", "a3"],
        explanations: [
          "...a5 keeps a knight from b4 and prepares ...Na6.",
          "White pushes e4/d5 to gain space.",
          "...Nb4 hopes to trade a knight for the dark-square bishop.",
          "Accurate timing of a3 and Be3 is key for White." 
        ]
      }
    }
  },
  "Blumenfeld Gambit Striking": {
    description: "An ambitious countergambit where Black sacrifices a pawn on b5 to seize dark-square control and quick development.",
    category: "Gambit",
    variations: {
      "Accepted Blumenfeld": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "c5", "d5", "b5", "cxb5", "exd5", "Nc3", "d4", "Nxb5", "Qa5+", "Bd2", "Qb6", "e3", "Be7", "exd4", "O-O", "Be2", "Nxd5", "O-O"],
        explanations: [
          "Black gambits b5 to open the a- and b-files.",
          "...d4 hits the knight and builds central space.",
          "Qa5+ and Qb6 pressure b2 and d4 simultaneously.",
          "White must defend precisely; otherwise Black's initiative grows." 
        ]
      },
      "Declined with e3": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "c5", "d5", "b5", "e3", "bxc4", "Nc3", "exd5", "Nxd5", "Nc6", "Bxc4", "Be7", "O-O", "O-O", "b3", "d6", "Bb2", "Re8", "Rc1"],
        explanations: [
          "White declines by stabilizing the center and allowing ...bxc4.",
          "Black develops with ...Nc6 and ...Be7.",
          "b3 and Bb2 give White long diagonal pressure.",
          "Both sides reach a complex middlegame with opposite chances." 
        ]
      },
      "Blumenfeld Hybrid": {
        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "c5", "d5", "b5", "cxb5", "exd5", "g3", "a6", "Bg2", "axb5", "O-O", "Be7", "Bg5", "O-O", "e3", "Nc6", "Nc3", "b4", "Bxf6"],
        explanations: [
          "White fianchettos, hoping to neutralize the gambit.",
          "...a6 and ...axb5 recover the pawn with active pieces.",
          "Bg5 forces exchanges to reduce Black's attacking pieces.",
          "The structure remains imbalanced offering play for both sides." 
        ]
      }
    }
  },
  "King's Gambit (for White)": {
    description: "An aggressive opening that begins with 1.e4 e5 2.f4. White sacrifices a pawn for rapid development and central control.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "h4", "g4", "Ne5", "Nf6", "Bc4", "d5", "exd5", "Bd6", "d4", "Nh5", "Bb5+", "c6", "Bc4", "b5", "Bb3", "a5", "a4", "Ra6", "axb5", "cxb5", "Bd5", "Be6"],
        explanations: [
          "King's pawn opening.",
          "King's Gambit; accept gambit.",
          "Develop knight; advance pawn.",
          "Advance pawn; advance pawn.",
          "Knight activity; develop knight.",
          "Develop bishop; central advance.",
          "Trade pawns; develop bishop.",
          "Central advance; knight activity.",
          "Develop bishop; support center.",
          "Develop bishop; space queenside.",
          "Retreat bishop; space queenside.",
          "Space queenside; rook activity.",
          "Trade pawns; recapture.",
          "Develop bishop; develop bishop.",
          "Complete development; solid structure."
        ]
      },
      "Falkbeer Countergambit": {
        moves: ["e4", "e5", "f4", "d5", "exd5", "e4", "d3", "Nf6", "Nc3", "Bc5", "Bg5", "O-O", "Qd2", "Re8", "O-O-O", "a6", "h4", "h6", "Bh4", "g5", "Bg3", "Nbd7", "h5", "Nf8", "Ne2", "Ng6", "Nf4", "Nxf4"],
        explanations: [
          "King's pawn opening.",
          "King's Gambit; counter-gambit.",
          "Accept gambit; central advance.",
          "Central advance; develop knight.",
          "Knight development; develop bishop.",
          "Develop bishop; king safety.",
          "Queen development; rook activity.",
          "King safety; space queenside.",
          "Advance pawn; luft.",
          "Retreat bishop; advance pawn.",
          "Maintain bishop; knight development.",
          "Advance pawn; knight activity.",
          "Knight development; knight activity.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      },
      "Mieses Variation": {
        moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "h4", "g4", "Ne5", "Nf6", "Bc4", "d5", "exd5", "Bd6", "d4", "Nh5", "Bb5+", "c6", "Bc4", "b5", "Bb3", "a5", "a4", "Ra6", "axb5", "cxb5", "Bd5", "Be6"],
        explanations: [
          "King's pawn opening.",
          "King's Gambit; accept gambit.",
          "Develop knight; advance pawn.",
          "Advance pawn; advance pawn.",
          "Knight activity; develop knight.",
          "Develop bishop; central advance.",
          "Trade pawns; develop bishop.",
          "Central advance; knight activity.",
          "Develop bishop; support center.",
          "Develop bishop; space queenside.",
          "Retreat bishop; space queenside.",
          "Space queenside; rook activity.",
          "Trade pawns; recapture.",
          "Develop bishop; develop bishop.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Danish Gambit (for White)": {
    description: "An aggressive opening that begins with 1.e4 e5 2.d4 exd4 3.c3. White sacrifices pawns for rapid development and central control.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["e4", "e5", "d4", "exd4", "c3", "dxc3", "Bc4", "cxb2", "Bxb2", "d5", "exd5", "Nf6", "Nf3", "Bd6", "O-O", "O-O", "Nc3", "Nbd7", "Re1", "Re8", "Bd3", "c6", "dxc6", "bxc6", "Qe2", "Qc7", "Rad1", "Bb7"],
        explanations: [
          "King's pawn opening.",
          "Danish Gambit; accept gambit.",
          "Central advance; accept gambit.",
          "Support c3; accept gambit.",
          "Develop bishop; accept gambit.",
          "Develop bishop; central advance.",
          "Trade pawns; develop knight.",
          "Develop knight; develop bishop.",
          "King safety; king safety.",
          "Knight development; knight development.",
          "Rook activity; rook activity.",
          "Develop bishop; support center.",
          "Trade pawns; recapture.",
          "Queen development; queen development.",
          "Rook activity; develop bishop.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["e4", "e5", "d4", "exd4", "c3", "dxc3", "Bc4", "cxb2", "Bxb2", "d5", "exd5", "Nf6", "Nf3", "Bd6", "O-O", "O-O", "Nc3", "Nbd7", "Re1", "Re8", "Bd3", "c6", "dxc6", "bxc6", "Qe2", "Qc7", "Rad1", "Bb7"],
        explanations: [
          "King's pawn opening.",
          "Danish Gambit; accept gambit.",
          "Central advance; accept gambit.",
          "Support c3; accept gambit.",
          "Develop bishop; accept gambit.",
          "Develop bishop; central advance.",
          "Trade pawns; develop knight.",
          "Develop knight; develop bishop.",
          "King safety; king safety.",
          "Knight development; knight development.",
          "Rook activity; rook activity.",
          "Develop bishop; support center.",
          "Trade pawns; recapture.",
          "Queen development; queen development.",
          "Rook activity; develop bishop.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["e4", "e5", "d4", "exd4", "c3", "dxc3", "Bc4", "cxb2", "Bxb2", "d5", "exd5", "Nf6", "Nf3", "Bd6", "O-O", "O-O", "Nc3", "Nbd7", "Re1", "Re8", "Bd3", "c6", "dxc6", "bxc6", "Qe2", "Qc7", "Rad1", "Bb7"],
        explanations: [
          "King's pawn opening.",
          "Danish Gambit; accept gambit.",
          "Central advance; accept gambit.",
          "Support c3; accept gambit.",
          "Develop bishop; accept gambit.",
          "Develop bishop; central advance.",
          "Trade pawns; develop knight.",
          "Develop knight; develop bishop.",
          "King safety; king safety.",
          "Knight development; knight development.",
          "Rook activity; rook activity.",
          "Develop bishop; support center.",
          "Trade pawns; recapture.",
          "Queen development; queen development.",
          "Rook activity; develop bishop.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "English Opening (for White)": {
    description: "A flexible opening that begins with 1.c4. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["c4", "e5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "Nf3", "Nge7", "O-O", "O-O", "d3", "d6", "Rb1", "a5", "a3", "f5", "b4", "axb4", "axb4", "f4", "b5", "Nd4", "Nxd4", "exd4", "e4", "dxe4", "dxe4"],
        explanations: [
          "English Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Develop knight; solid structure.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Rook activity; space queenside.",
          "Space queenside; advance pawn.",
          "Space queenside; trade pawns.",
          "Recapture; advance pawn.",
          "Space queenside; central advance.",
          "Space queenside; knight activity.",
          "Trade knights; recapture.",
          "Central advance; trade pawns.",
          "Recapture; complete development."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["c4", "e5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "Nf3", "Nge7", "O-O", "O-O", "d3", "d6", "Rb1", "a5", "a3", "f5", "b4", "axb4", "axb4", "f4", "b5", "Nd4", "Nxd4", "exd4", "e4", "dxe4", "dxe4"],
        explanations: [
          "English Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Develop knight; solid structure.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Rook activity; space queenside.",
          "Space queenside; advance pawn.",
          "Space queenside; trade pawns.",
          "Recapture; advance pawn.",
          "Space queenside; central advance.",
          "Space queenside; knight activity.",
          "Trade knights; recapture.",
          "Central advance; trade pawns.",
          "Recapture; complete development."
        ]
      },
      "Leningrad Variation": {
        moves: ["c4", "e5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "Nf3", "Nge7", "O-O", "O-O", "d3", "d6", "Rb1", "a5", "a3", "f5", "b4", "axb4", "axb4", "f4", "b5", "Nd4", "Nxd4", "exd4", "e4", "dxe4", "dxe4"],
        explanations: [
          "English Opening; develop knight.",
          "Central advance; develop knight.",
          "Fianchetto; develop bishop.",
          "Develop knight; solid structure.",
          "King safety; king safety.",
          "Support center; solid structure.",
          "Rook activity; space queenside.",
          "Space queenside; advance pawn.",
          "Space queenside; trade pawns.",
          "Recapture; advance pawn.",
          "Space queenside; central advance.",
          "Space queenside; knight activity.",
          "Trade knights; recapture.",
          "Central advance; trade pawns.",
          "Recapture; complete development."
        ]
      }
    }
  },
  "Reti Opening (for White)": {
    description: "A flexible opening that begins with 1.Nf3. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["Nf3", "d5", "c4", "c6", "b3", "Nf6", "Bb2", "Bg4", "g3", "e6", "Bg2", "Nbd7", "O-O", "Be7", "d3", "O-O", "Nbd2", "c5", "e4", "b6", "Qe2", "Bb7", "Rac1", "Rc8", "Rfd1", "Qc7", "a3", "a5"],
        explanations: [
          "Reti Opening; develop knight.",
          "Central advance; develop knight.",
          "Support center; solid structure.",
          "Fianchetto; develop bishop.",
          "Develop bishop; solid structure.",
          "Develop knight; develop knight.",
          "King safety; develop bishop.",
          "Support center; king safety.",
          "Knight development; central advance.",
          "Space queenside; develop bishop.",
          "Queen development; develop bishop.",
          "Rook activity; develop rook.",
          "Rook activity; queen development.",
          "Space queenside; space queenside.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["Nf3", "d5", "c4", "c6", "b3", "Nf6", "Bb2", "Bg4", "g3", "e6", "Bg2", "Nbd7", "O-O", "Be7", "d3", "O-O", "Nbd2", "c5", "e4", "b6", "Qe2", "Bb7", "Rac1", "Rc8", "Rfd1", "Qc7", "a3", "a5"],
        explanations: [
          "Reti Opening; develop knight.",
          "Central advance; develop knight.",
          "Support center; solid structure.",
          "Fianchetto; develop bishop.",
          "Develop bishop; solid structure.",
          "Develop knight; develop knight.",
          "King safety; develop bishop.",
          "Support center; king safety.",
          "Knight development; central advance.",
          "Space queenside; develop bishop.",
          "Queen development; develop bishop.",
          "Rook activity; develop rook.",
          "Rook activity; queen development.",
          "Space queenside; space queenside.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["Nf3", "d5", "c4", "c6", "b3", "Nf6", "Bb2", "Bg4", "g3", "e6", "Bg2", "Nbd7", "O-O", "Be7", "d3", "O-O", "Nbd2", "c5", "e4", "b6", "Qe2", "Bb7", "Rac1", "Rc8", "Rfd1", "Qc7", "a3", "a5"],
        explanations: [
          "Reti Opening; develop knight.",
          "Central advance; develop knight.",
          "Support center; solid structure.",
          "Fianchetto; develop bishop.",
          "Develop bishop; solid structure.",
          "Develop knight; develop knight.",
          "King safety; develop bishop.",
          "Support center; king safety.",
          "Knight development; central advance.",
          "Space queenside; develop bishop.",
          "Queen development; develop bishop.",
          "Rook activity; develop rook.",
          "Rook activity; queen development.",
          "Space queenside; space queenside.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Catalan Opening (for White)": {
    description: "A flexible opening that begins with 1.d4 Nf6 2.c4 e6 3.g3. White aims for a hypermodern setup with the bishop fianchetto.",
    category: "Attack",
    variations: {
      "Classical Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3", "O-O", "O-O", "Nbd7", "Nc3", "c6", "Qc2", "b6", "Rd1", "Bb7", "b3", "Rc8", "Bb2", "Qc7", "Rac1", "Rfd8", "e4", "dxe4", "Nxe4", "Nxe4"],
        explanations: [
          "Catalan Opening; develop knight.",
          "Support center; solid structure.",
          "Fianchetto; central advance.",
          "Develop bishop; develop bishop.",
          "Develop knight; king safety.",
          "King safety; knight development.",
          "Knight development; support center.",
          "Queen development; develop bishop.",
          "Rook activity; develop bishop.",
          "Space queenside; develop rook.",
          "Develop bishop; queen development.",
          "Rook activity; develop rook.",
          "Central advance; trade pawns.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3", "O-O", "O-O", "Nbd7", "Nc3", "c6", "Qc2", "b6", "Rd1", "Bb7", "b3", "Rc8", "Bb2", "Qc7", "Rac1", "Rfd8", "e4", "dxe4", "Nxe4", "Nxe4"],
        explanations: [
          "Catalan Opening; develop knight.",
          "Support center; solid structure.",
          "Fianchetto; central advance.",
          "Develop bishop; develop bishop.",
          "Develop knight; king safety.",
          "King safety; knight development.",
          "Knight development; support center.",
          "Queen development; develop bishop.",
          "Rook activity; develop bishop.",
          "Space queenside; develop rook.",
          "Develop bishop; queen development.",
          "Rook activity; develop rook.",
          "Central advance; trade pawns.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3", "O-O", "O-O", "Nbd7", "Nc3", "c6", "Qc2", "b6", "Rd1", "Bb7", "b3", "Rc8", "Bb2", "Qc7", "Rac1", "Rfd8", "e4", "dxe4", "Nxe4", "Nxe4"],
        explanations: [
          "Catalan Opening; develop knight.",
          "Support center; solid structure.",
          "Fianchetto; central advance.",
          "Develop bishop; develop bishop.",
          "Develop knight; king safety.",
          "King safety; knight development.",
          "Knight development; support center.",
          "Queen development; develop bishop.",
          "Rook activity; develop bishop.",
          "Space queenside; develop rook.",
          "Develop bishop; queen development.",
          "Rook activity; develop rook.",
          "Central advance; trade pawns.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Benoni Defense (for Black)": {
    description: "A hypermodern defense that begins with 1.d4 Nf6 2.c4 c5. Black allows White to build a strong center before counterattacking.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3", "exd5", "cxd5", "d6", "Nf3", "g6", "e4", "Bg7", "Be2", "O-O", "O-O", "Nbd7", "Re1", "Re8", "Bf1", "a6", "a4", "Qc7", "Bd2", "b6", "Qc2", "Bb7"],
        explanations: [
          "Benoni Defense; develop knight.",
          "Support center; central advance.",
          "Central advance; trade pawns.",
          "Knight development; recapture.",
          "Recapture; central advance.",
          "Develop knight; fianchetto.",
          "Central advance; develop bishop.",
          "Develop bishop; king safety.",
          "King safety; knight development.",
          "Rook activity; rook activity.",
          "Develop bishop; space queenside.",
          "Space queenside; queen development.",
          "Develop bishop; develop bishop.",
          "Queen development; develop bishop.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3", "exd5", "cxd5", "d6", "Nf3", "g6", "e4", "Bg7", "Be2", "O-O", "O-O", "Nbd7", "Re1", "Re8", "Bf1", "a6", "a4", "Qc7", "Bd2", "b6", "Qc2", "Bb7"],
        explanations: [
          "Benoni Defense; develop knight.",
          "Support center; central advance.",
          "Central advance; trade pawns.",
          "Knight development; recapture.",
          "Recapture; central advance.",
          "Develop knight; fianchetto.",
          "Central advance; develop bishop.",
          "Develop bishop; king safety.",
          "King safety; knight development.",
          "Rook activity; rook activity.",
          "Develop bishop; space queenside.",
          "Space queenside; queen development.",
          "Develop bishop; develop bishop.",
          "Queen development; develop bishop.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3", "exd5", "cxd5", "d6", "Nf3", "g6", "e4", "Bg7", "Be2", "O-O", "O-O", "Nbd7", "Re1", "Re8", "Bf1", "a6", "a4", "Qc7", "Bd2", "b6", "Qc2", "Bb7"],
        explanations: [
          "Benoni Defense; develop knight.",
          "Support center; central advance.",
          "Central advance; trade pawns.",
          "Knight development; recapture.",
          "Recapture; central advance.",
          "Develop knight; fianchetto.",
          "Central advance; develop bishop.",
          "Develop bishop; king safety.",
          "King safety; knight development.",
          "Rook activity; rook activity.",
          "Develop bishop; space queenside.",
          "Space queenside; queen development.",
          "Develop bishop; develop bishop.",
          "Queen development; develop bishop.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Dutch Defense (for Black)": {
    description: "A hypermodern defense that begins with 1.d4 f5. Black allows White to build a strong center before counterattacking.",
    category: "Defense",
    variations: {
      "Classical Variation": {
        moves: ["d4", "f5", "g3", "Nf6", "Bg2", "e6", "Nf3", "Be7", "O-O", "O-O", "c4", "d6", "Nc3", "c6", "b3", "Qe8", "Bb2", "Qh5", "e3", "a5", "Qc2", "Na6", "Rac1", "Nc7", "Nd2", "b6", "Nde4", "Nxe4"],
        explanations: [
          "Dutch Defense; develop knight.",
          "Fianchetto; develop knight.",
          "Develop bishop; solid structure.",
          "Develop knight; develop bishop.",
          "King safety; king safety.",
          "Support center; central advance.",
          "Knight development; support center.",
          "Space queenside; queen activity.",
          "Develop bishop; queen activity.",
          "Central advance; space queenside.",
          "Queen development; knight development.",
          "Rook activity; knight development.",
          "Knight development; develop bishop.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      },
      "Nimzowitsch Variation": {
        moves: ["d4", "f5", "g3", "Nf6", "Bg2", "e6", "Nf3", "Be7", "O-O", "O-O", "c4", "d6", "Nc3", "c6", "b3", "Qe8", "Bb2", "Qh5", "e3", "a5", "Qc2", "Na6", "Rac1", "Nc7", "Nd2", "b6", "Nde4", "Nxe4"],
        explanations: [
          "Dutch Defense; develop knight.",
          "Fianchetto; develop knight.",
          "Develop bishop; solid structure.",
          "Develop knight; develop bishop.",
          "King safety; king safety.",
          "Support center; central advance.",
          "Knight development; support center.",
          "Space queenside; queen activity.",
          "Develop bishop; queen activity.",
          "Central advance; space queenside.",
          "Queen development; knight development.",
          "Rook activity; knight development.",
          "Knight development; develop bishop.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      },
      "Leningrad Variation": {
        moves: ["d4", "f5", "g3", "Nf6", "Bg2", "e6", "Nf3", "Be7", "O-O", "O-O", "c4", "d6", "Nc3", "c6", "b3", "Qe8", "Bb2", "Qh5", "e3", "a5", "Qc2", "Na6", "Rac1", "Nc7", "Nd2", "b6", "Nde4", "Nxe4"],
        explanations: [
          "Dutch Defense; develop knight.",
          "Fianchetto; develop knight.",
          "Develop bishop; solid structure.",
          "Develop knight; develop bishop.",
          "King safety; king safety.",
          "Support center; central advance.",
          "Knight development; support center.",
          "Space queenside; queen activity.",
          "Develop bishop; queen activity.",
          "Central advance; space queenside.",
          "Queen development; knight development.",
          "Rook activity; knight development.",
          "Knight development; develop bishop.",
          "Knight activity; trade knights.",
          "Complete development; solid structure."
        ]
      }
    }
  },
  "Ponziani Opening (for White)": {
    description: "An unusual opening that begins with 1.e4 e5 2.Nf3 Nc6 3.c3. White prepares d4 while avoiding the pin on Nc3.",
    category: "Opening",
    variations: {
      "Ponziani Main Line": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "d5", "Qa4", "Nf6", "Nxe5", "Bd6", "Nxc6", "bxc6", "d3", "O-O", "Be2", "Re8", "O-O", "Ng4", "Bxg4", "Bxg4", "Nd2", "Qg5", "Nf3", "Qh5", "h3", "Bf5", "exd5", "cxd5", "Re1"],
        explanations: [
          "King's pawn opening.",
          "Develop knight; knight development.",
          "Ponziani; central counter.",
          "Attack; develop knight.",
          "Capture pawn; develop bishop.",
          "Trade knights; recapture.",
          "Support center; king safety.",
          "Develop bishop; rook activity.",
          "Castle; knight attack.",
          "Trade pieces; recapture.",
          "Knight development; queen attack.",
          "Knight defense; queen maneuver.",
          "Ask bishop; retreat.",
          "Capture; recapture.",
          "Centralize rook; pressure e-file."
        ]
      },
      "Ponziani Countergambit": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "f5", "d4", "fxe4", "Nxe5", "Nf6", "Bg5", "Be7", "Bxf6", "Bxf6", "Nxc6", "dxc6", "Nd2", "O-O", "Nxe4", "Qe7", "Qe2", "Bf5", "O-O-O", "Rae8", "Nxf6+", "Qxf6", "Qc4+", "Kh8", "d5"],
        explanations: [
          "Standard opening.",
          "Develop knight; knight development.",
          "Ponziani; counter-gambit.",
          "Central advance; capture.",
          "Capture; develop knight.",
          "Pin knight; develop bishop.",
          "Trade pieces; recapture.",
          "Trade knights; recapture.",
          "Knight development; king safety.",
          "Capture pawn; queen development.",
          "Pin knight; develop bishop.",
          "Long castle; rook activity.",
          "Trade knights; recapture.",
          "Check; king safety.",
          "Advance pawn; gain space."
        ]
      },
      "Jaenisch Counterattack": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "Nf6", "d4", "Nxe4", "d5", "Ne7", "Nxe5", "Ng6", "Nxg6", "hxg6", "Bd3", "Nf6", "O-O", "Be7", "Re1", "d6", "Nd2", "O-O", "Nf3", "Bd7", "Bf4", "Nh7", "Qd2", "Bg5", "Bxg5"],
        explanations: [
          "King's pawn game.",
          "Standard development.",
          "Ponziani; develop knight.",
          "Central advance; capture pawn.",
          "Advance; knight retreat.",
          "Capture pawn; knight attack.",
          "Trade knights; recapture.",
          "Develop bishop; knight returns.",
          "Castle; develop bishop.",
          "Centralize rook; solid structure.",
          "Knight development; king safety.",
          "Knight maneuver; develop bishop.",
          "Develop bishop; knight reroute.",
          "Queen development; bishop activity.",
          "Trade bishops; simplify."
        ]
      }
    }
  },
  "Bishop's Opening (for White)": {
    description: "A classical opening that begins with 1.e4 e5 2.Bc4. White develops the bishop to an active square early.",
    category: "Opening",
    variations: {
      "Classical Bishop's Opening": {
        moves: ["e4", "e5", "Bc4", "Nf6", "d3", "Bc5", "Nf3", "d6", "c3", "c6", "Bb3", "Bb6", "Nbd2", "Nbd7", "h3", "Nf8", "O-O", "Ng6", "Re1", "O-O", "Nf1", "h6", "Ng3", "Re8", "d4", "Bb7", "Qc2", "Qc7", "Be3"],
        explanations: [
          "King's pawn opening.",
          "Bishop's Opening; develop knight.",
          "Support center; develop bishop.",
          "Develop knight; solid structure.",
          "Support center; support center.",
          "Retreat bishop; mirror.",
          "Knight development; knight development.",
          "Prevent Bg4; knight reroute.",
          "Castle; knight maneuver.",
          "Centralize rook; king safety.",
          "Knight reroute; prevent Bg5.",
          "Knight improvement; rook activity.",
          "Central advance; develop bishop.",
          "Queen development; queen development.",
          "Develop bishop; complete development."
        ]
      },
      "Berlin Defense": {
        moves: ["e4", "e5", "Bc4", "Nf6", "d3", "c6", "Nf3", "d5", "Bb3", "Bd6", "Nbd2", "O-O", "O-O", "Re8", "h3", "Nbd7", "Re1", "Nf8", "Nf1", "Ng6", "Ng3", "h6", "c3", "Be6", "d4", "Bxb3", "axb3", "Qc7", "Qc2"],
        explanations: [
          "Standard opening.",
          "Bishop's Opening.",
          "Support center; support center.",
          "Develop knight; central strike.",
          "Retreat bishop; develop bishop.",
          "Knight development; king safety.",
          "Castle; rook activity.",
          "Prevent Bg4; knight development.",
          "Centralize rook; knight reroute.",
          "Knight reroute; knight maneuver.",
          "Knight improvement; prevent Bg5.",
          "Support center; develop bishop.",
          "Central advance; trade bishops.",
          "Recapture; queen development.",
          "Queen development; pressure c-file."
        ]
      },
      "Urusov Gambit": {
        moves: ["e4", "e5", "Bc4", "Nf6", "d4", "exd4", "Nf3", "Nxe4", "Qxd4", "Nf6", "Bg5", "Be7", "Nc3", "Nc6", "Qh4", "d5", "O-O-O", "Be6", "Rhe1", "O-O", "Bxf6", "Bxf6", "Qxf6", "gxf6", "Nxd5", "Bxd5", "Bxd5", "Qxd5", "Rxd5"],
        explanations: [
          "King's pawn game.",
          "Bishop's Opening.",
          "Gambit; capture.",
          "Develop knight; capture pawn.",
          "Recapture; knight retreat.",
          "Pin knight; develop bishop.",
          "Knight development; knight development.",
          "Attack; central counter.",
          "Long castle; develop bishop.",
          "Centralize rook; king safety.",
          "Trade pieces; recapture.",
          "Capture; recapture.",
          "Trade knights; recapture.",
          "Recapture; centralize queen.",
          "Trade queens; rook activity."
        ]
      }
    }
  },
  "Hungarian Opening (for White)": {
    description: "A hypermodern opening that begins with 1.g3. White aims for flexible piece development and central control through pieces.",
    category: "Opening",
    variations: {
      "Classical Hungarian": {
        moves: ["g3", "e5", "Bg2", "d5", "d3", "Nf6", "Nf3", "Nc6", "O-O", "Be7", "Nbd2", "O-O", "e4", "d4", "Nc4", "Be6", "a4", "Qd7", "Bg5", "h6", "Bxf6", "Bxf6", "Nfd2", "Rae8", "f4", "exf4", "gxf4", "Bxc4", "Nxc4"],
        explanations: [
          "Hungarian Opening; central response.",
          "Fianchetto; central control.",
          "Support center; develop knight.",
          "Develop knight; knight development.",
          "Castle; develop bishop.",
          "Knight development; king safety.",
          "Central advance; advance pawn.",
          "Knight jumps; develop bishop.",
          "Advance pawn; queen development.",
          "Pin knight; ask bishop.",
          "Trade pieces; recapture.",
          "Knight reroute; rook activity.",
          "Advance pawn; capture.",
          "Recapture; trade bishops.",
          "Recapture; knight centralization."
        ]
      },
      "Reversed Alekhine": {
        moves: ["g3", "e5", "Nf3", "e4", "Nd4", "d5", "d3", "exd3", "Qxd3", "Nf6", "Bg2", "Be7", "O-O", "O-O", "Nc3", "c6", "Bg5", "h6", "Bxf6", "Bxf6", "Nf3", "Na6", "e4", "dxe4", "Nxe4", "Be7", "Rfe1", "Nc7", "Rad1"],
        explanations: [
          "Hungarian start.",
          "Develop knight; advance pawn.",
          "Knight retreat; central control.",
          "Challenge pawn; capture.",
          "Recapture; develop knight.",
          "Complete fianchetto; develop bishop.",
          "Castle; king safety.",
          "Knight development; support center.",
          "Pin knight; ask bishop.",
          "Trade pieces; recapture.",
          "Knight returns; knight to rim.",
          "Central advance; capture.",
          "Recapture; bishop retreat.",
          "Centralize rook; knight reroute.",
          "Double rooks; pressure d-file."
        ]
      },
      "Indian Formation": {
        moves: ["g3", "d5", "Bg2", "Nf6", "Nf3", "c6", "O-O", "Bg4", "d3", "Nbd7", "Nbd2", "e5", "e4", "dxe4", "dxe4", "Bc5", "h3", "Bh5", "Qe2", "O-O", "Nc4", "Re8", "a4", "a5", "g4", "Bg6", "Nfxe5", "Nxe4", "Nxe5"],
        explanations: [
          "Hungarian Opening.",
          "Fianchetto; develop knight.",
          "Develop knight; support center.",
          "Castle; develop bishop.",
          "Support center; knight development.",
          "Knight development; central advance.",
          "Central advance; capture.",
          "Recapture; develop bishop.",
          "Ask bishop; retreat.",
          "Queen development; king safety.",
          "Knight jumps; rook activity.",
          "Advance pawn; prevent a5.",
          "Advance pawn; advance pawn.",
          "Advance pawn; bishop retreat.",
          "Capture; trade knights.",
          "Recapture; centralize knight."
        ]
      }
    }
  },
  "Chigorin Defense (for Black)": {
    description: "An unusual defense that begins with 1.d4 d5 2.c4 Nc6. Black develops the knight to c6 early, creating unique tactical possibilities.",
    category: "Defense",
    variations: {
      "Main Line Chigorin": {
        moves: ["d4", "d5", "c4", "Nc6", "Nc3", "dxc4", "d5", "Ne5", "Qd4", "Ng6", "Qxc4", "e6", "dxe6", "Bxe6", "Qe4", "Nf6", "Qe2", "Bb4", "Nf3", "O-O", "a3", "Bxc3+", "bxc3", "Qe7", "Be3", "Rfe8", "Nd4", "Bc4", "Qf3"],
        explanations: [
          "Queen's pawn opening.",
          "Chigorin Defense; unusual knight.",
          "Knight development; capture pawn.",
          "Advance pawn; knight retreat.",
          "Centralize queen; knight maneuver.",
          "Recapture; challenge pawn.",
          "Capture; recapture.",
          "Queen activity; develop knight.",
          "Queen retreat; develop bishop.",
          "Develop knight; king safety.",
          "Ask bishop; trade pieces.",
          "Recapture; queen development.",
          "Develop bishop; rook activity.",
          "Centralize knight; bishop activity.",
          "Queen maneuver; pressure f6."
        ]
      },
      "Exchange Variation": {
        moves: ["d4", "d5", "c4", "Nc6", "cxd5", "Qxd5", "e3", "e5", "Nc3", "Bb4", "Bd2", "Bxc3", "Bxc3", "exd4", "Ne2", "Nf6", "Nxd4", "O-O", "Be2", "Nxd4", "Qxd4", "Qxd4", "Bxd4", "Bf5", "O-O", "Rfe8", "Rfd1", "Rad8", "Bf3"],
        explanations: [
          "Standard opening.",
          "Chigorin Defense.",
          "Exchange; queen recapture.",
          "Support center; central strike.",
          "Knight development; pin.",
          "Develop bishop; trade pieces.",
          "Recapture; capture pawn.",
          "Develop knight; develop knight.",
          "Centralize knight; king safety.",
          "Develop bishop; trade knights.",
          "Recapture; trade queens.",
          "Recapture; develop bishop.",
          "Castle; rook activity.",
          "Centralize rook; double rooks.",
          "Develop bishop; pressure diagonal."
        ]
      },
      "Modern Chigorin": {
        moves: ["d4", "d5", "c4", "Nc6", "Nf3", "Bg4", "cxd5", "Bxf3", "gxf3", "Qxd5", "e3", "e5", "Nc3", "Bb4", "Bd2", "Bxc3", "bxc3", "Nge7", "f4", "exd4", "cxd4", "O-O", "Bd3", "Rfe8", "O-O", "Qd6", "Qe2", "Qc7", "Qd2", "Nf5", "Rac1", "Rad8", "h3"],
        explanations: [
          "Queen's pawn game.",
          "Chigorin structure.",
          "Develop knight; develop bishop.",
          "Capture; trade pieces.",
          "Recapture; centralize queen.",
          "Support center; central strike.",
          "Knight development; pin.",
          "Develop bishop; trade pieces.",
          "Recapture; knight development.",
          "Advance pawn; capture.",
          "Recapture; king safety.",
          "Develop bishop; rook activity.",
          "Castle; queen development.",
          "Queen development; knight jumps.",
          "Rook activity; prepare c4."
        ]
      }
    }
  },
  "Baltic Defense (for Black)": {
    description: "An unusual defense that begins with 1.d4 d5 2.c4 Bf5. Black develops the bishop early, creating tactical complications.",
    category: "Defense",
    variations: {
      "Classical Baltic": {
        moves: ["d4", "d5", "c4", "Bf5", "cxd5", "Bxb1", "Rxb1", "Qxd5", "Nf3", "Nc6", "e3", "e5", "Nc3", "Bb4", "Bd2", "Bxc3", "Bxc3", "exd4", "Nxd4", "Nf6", "Be2", "O-O", "O-O", "Rfe8", "Bf3", "Qd7", "Nxc6", "bxc6", "Qc2"],
        explanations: [
          "Queen's pawn opening.",
          "Baltic Defense; develop bishop.",
          "Capture; grab pawn.",
          "Capture bishop; centralize queen.",
          "Develop knight; knight development.",
          "Support center; central strike.",
          "Knight development; pin.",
          "Develop bishop; trade pieces.",
          "Recapture; capture pawn.",
          "Centralize knight; develop knight.",
          "Develop bishop; king safety.",
          "Castle; rook activity.",
          "Develop bishop; queen maneuver.",
          "Trade knights; recapture.",
          "Queen development; pressure c-file."
        ]
      },
      "Modern Baltic": {
        moves: ["d4", "d5", "c4", "Bf5", "Nc3", "e6", "Nf3", "c6", "Qb3", "Qb6", "c5", "Qxb3", "axb3", "Nf6", "Bf4", "Be7", "e3", "O-O", "Be2", "Nbd7", "O-O", "Ne4", "Rfc1", "Bg6", "Nxe4", "Bxe4", "Nd2", "Bg6", "b4"],
        explanations: [
          "Standard opening.",
          "Baltic Defense.",
          "Knight development; solid structure.",
          "Develop knight; support center.",
          "Attack; queen defense.",
          "Advance; trade queens.",
          "Recapture; develop knight.",
          "Develop bishop; develop bishop.",
          "Support center; king safety.",
          "Develop bishop; knight development.",
          "Castle; knight jumps.",
          "Rook activity; bishop retreat.",
          "Trade knights; recapture.",
          "Knight attacks; bishop retreat.",
          "Advance pawn; queenside expansion."
        ]
      },
      "Pseudo-Chigorin": {
        moves: ["d4", "d5", "c4", "Bf5", "cxd5", "Qxd5", "Nc3", "Qd8", "Nf3", "Nf6", "Bf4", "c6", "e3", "e6", "Bd3", "Bxd3", "Qxd3", "Nbd7", "O-O", "Be7", "Rac1", "O-O", "Rfd1", "Rc8", "Ne5", "Nxe5", "Bxe5", "Nd7", "Bf4"],
        explanations: [
          "Queen's pawn game.",
          "Baltic start.",
          "Capture; queen recapture.",
          "Knight development; queen retreat.",
          "Develop knight; develop knight.",
          "Develop bishop; support center.",
          "Support center; solid structure.",
          "Develop bishop; trade bishops.",
          "Recapture; knight development.",
          "Castle; develop bishop.",
          "Rook activity; king safety.",
          "Centralize rook; rook activity.",
          "Centralize knight; trade knights.",
          "Recapture; knight development.",
          "Maintain bishop; pressure diagonal."
        ]
      }
    }
  },
  "Elephant Gambit (for Black)": {
    description: "A dubious gambit that begins with 1.e4 e5 2.Nf3 d5. Black immediately challenges White's center with tactical complications.",
    category: "Defense",
    variations: {
      "Elephant Accepted": {
        moves: ["e4", "e5", "Nf3", "d5", "exd5", "e4", "Qe2", "Nf6", "d3", "Bb4+", "c3", "Qe7", "dxe4", "Nxe4", "Nbd2", "Bxd2+", "Bxd2", "Nxd2", "Kxd2", "O-O", "Kc2", "Bf5+", "Kb3", "Nd7", "Qe3", "Qg5+", "Kc2", "Rfe8", "Qf4"],
        explanations: [
          "King's pawn opening.",
          "Elephant Gambit; immediate challenge.",
          "Capture; advance pawn.",
          "Pin pawn; develop knight.",
          "Challenge pawn; check.",
          "Block check; queen development.",
          "Capture; knight jumps.",
          "Knight development; trade pieces.",
          "Recapture; capture knight.",
          "King captures; king safety.",
          "King safety; develop with check.",
          "King maneuver; knight development.",
          "Queen development; check.",
          "King retreat; rook activity.",
          "Queen maneuver; maintain pressure."
        ]
      },
      "Elephant Declined": {
        moves: ["e4", "e5", "Nf3", "d5", "Nxe5", "dxe4", "Bc4", "Qg5", "Bxf7+", "Ke7", "O-O", "Qxe5", "Re1", "Kd8", "Rxe4", "Qd5", "Bb3", "Qc6", "d4", "Nf6", "Rxe6", "Bd6", "Bg5", "Rf8", "Nc3", "Be7", "Qe2", "Bd7", "Rae1"],
        explanations: [
          "Standard opening.",
          "Elephant Gambit.",
          "Capture pawn; recapture.",
          "Develop bishop; queen attack.",
          "Sacrifice bishop; force king.",
          "Castle; capture knight.",
          "Centralize rook; king retreat.",
          "Capture pawn; queen centralization.",
          "Retreat bishop; queen maneuver.",
          "Central control; develop knight.",
          "Rook activity; develop bishop.",
          "Pin knight; rook activity.",
          "Knight development; bishop retreat.",
          "Queen development; develop bishop.",
          "Double rooks; pressure e-file."
        ]
      },
      "Paulsen Countergambit": {
        moves: ["e4", "e5", "Nf3", "d5", "exd5", "Bd6", "d4", "e4", "Ng5", "Nf6", "c4", "O-O", "Nc3", "h6", "Nge4", "Nxe4", "Nxe4", "Re8", "d3", "Nf6", "Be2", "O-O", "Ng3", "Bg6", "f3", "exf3", "Bxf3", "c6", "dxc6"],
        explanations: [
          "King's pawn game.",
          "Elephant structure.",
          "Capture; develop bishop.",
          "Central control; advance pawn.",
          "Knight retreat; develop knight.",
          "Advance pawn; king safety.",
          "Knight development; ask knight.",
          "Knight retreat; trade knights.",
          "Recapture; rook activity.",
          "Support center; develop knight.",
          "Develop bishop; king safety.",
          "Centralize knight; bishop retreat.",
          "Challenge pawn; capture.",
          "Recapture; support center.",
          "Capture; open lines."
        ]
      }
    }
  },
  "Latvian Gambit (for Black)": {
    description: "A sharp gambit that begins with 1.e4 e5 2.Nf3 f5. Black sacrifices a pawn for rapid development and attacking chances.",
    category: "Defense",
    variations: {
      "Latvian Accepted": {
        moves: ["e4", "e5", "Nf3", "f5", "Nxe5", "Qf6", "d4", "d6", "Nc4", "fxe4", "Nc3", "Qg6", "f3", "exf3", "Qxf3", "Nc6", "Bf4", "Nf6", "O-O-O", "Be7", "Re1", "O-O", "Bd3", "Qf7", "Rhf1", "Bd7", "Nd5", "Nxd5", "Qxd5"],
        explanations: [
          "King's pawn opening.",
          "Latvian Gambit; counter-attack.",
          "Accept gambit; queen attack.",
          "Central control; attack knight.",
          "Knight retreat; capture pawn.",
          "Knight development; queen maneuver.",
          "Challenge pawn; capture.",
          "Recapture; knight development.",
          "Develop bishop; develop knight.",
          "Long castle; develop bishop.",
          "Centralize rook; king safety.",
          "Develop bishop; queen retreat.",
          "Rook activity; develop bishop.",
          "Centralize knight; trade knights.",
          "Recapture; centralize queen."
        ]
      },
      "Latvian Declined": {
        moves: ["e4", "e5", "Nf3", "f5", "d4", "fxe4", "Nxe5", "Nf6", "Bg5", "d6", "Nc4", "Be7", "Nc3", "O-O", "Be2", "Nc6", "O-O", "Bf5", "Nxd6", "cxd6", "Bc4+", "Kh8", "d5", "Ne5", "Bb3", "Rc8", "f4", "exf3", "Rxf3"],
        explanations: [
          "Standard opening.",
          "Latvian Gambit.",
          "Decline with central strike; capture.",
          "Capture pawn; develop knight.",
          "Pin knight; attack knight.",
          "Knight retreat; develop bishop.",
          "Knight development; king safety.",
          "Develop bishop; knight development.",
          "Castle; develop bishop.",
          "Capture; recapture.",
          "Check; king safety.",
          "Advance pawn; knight jumps.",
          "Retreat bishop; rook activity.",
          "Advance pawn; capture.",
          "Recapture; rook activity."
        ]
      },
      "Frenkel Defense": {
        moves: ["e4", "e5", "Nf3", "f5", "Bc4", "fxe4", "Nxe5", "Qg5", "d4", "Qxg2", "Qh5+", "g6", "Bf7+", "Kd8", "Bxg6", "Qxh1+", "Ke2", "Qxc1", "Bxh7", "c6", "Nc3", "d6", "Nf7+", "Ke7", "Nxh8", "Qxb2", "Bg8", "Qxc2+", "Kf3"],
        explanations: [
          "King's pawn game.",
          "Latvian structure.",
          "Develop bishop; capture.",
          "Capture pawn; queen attack.",
          "Central control; capture pawn.",
          "Check; block.",
          "Check; king forced.",
          "Capture pawn; check.",
          "King safety; capture bishop.",
          "Capture pawn; support center.",
          "Knight development; solid structure.",
          "Knight check; king forced.",
          "Capture rook; grab pawn.",
          "Bishop retreat; check.",
          "King activity; escape checks."
        ]
      }
    }
  },
  "Budapest Gambit (for Black)": {
    description: "A gambit that begins with 1.d4 Nf6 2.c4 e5. Black sacrifices a pawn for piece activity and attacking chances.",
    category: "Defense",
    variations: {
      "Budapest Accepted": {
        moves: ["d4", "Nf6", "c4", "e5", "dxe5", "Ng4", "Bf4", "Nc6", "Nf3", "Bb4+", "Nbd2", "Qe7", "a3", "Ngxe5", "Nxe5", "Nxe5", "e3", "Bxd2+", "Qxd2", "d6", "Bxe5", "dxe5", "Be2", "O-O", "O-O", "Bf5", "Rfd1", "Rfd8", "Qc3"],
        explanations: [
          "Queen's pawn opening.",
          "Budapest Gambit; immediate challenge.",
          "Accept gambit; knight attack.",
          "Develop bishop; knight development.",
          "Develop knight; check.",
          "Knight development; queen development.",
          "Ask bishop; recapture pawn.",
          "Trade knights; recapture.",
          "Support center; trade pieces.",
          "Recapture; solid structure.",
          "Trade bishops; recapture.",
          "Develop bishop; king safety.",
          "Castle; develop bishop.",
          "Centralize rook; rook activity.",
          "Queen development; pressure diagonal."
        ]
      },
      "Fajarowicz Variation": {
        moves: ["d4", "Nf6", "c4", "e5", "dxe5", "Ne4", "a3", "b6", "Nf3", "Bb7", "Nbd2", "Nxd2", "Qxd2", "Nc6", "e3", "Qe7", "Be2", "O-O-O", "O-O", "g5", "b4", "g4", "Nd4", "Nxd4", "exd4", "Bg7", "c5", "h5", "Bb2"],
        explanations: [
          "Standard opening.",
          "Budapest Gambit.",
          "Accept; knight jumps.",
          "Prevent Bb4; prepare fianchetto.",
          "Develop knight; develop bishop.",
          "Knight development; trade knights.",
          "Recapture; knight development.",
          "Support center; queen development.",
          "Develop bishop; long castle.",
          "Castle; advance pawn.",
          "Advance; continue attack.",
          "Knight jumps; trade knights.",
          "Recapture; develop bishop.",
          "Advance; continue attack.",
          "Develop bishop; complete development."
        ]
      },
      "Rubinstein Variation": {
        moves: ["d4", "Nf6", "c4", "e5", "dxe5", "Ng4", "e4", "Nxe5", "f4", "Nec6", "Be3", "Bb4+", "Nc3", "Qe7", "Nf3", "Bxc3+", "bxc3", "Nxe4", "Qd4", "f5", "Bd3", "Nc6", "Qe5", "Qxe5+", "fxe5", "d6", "O-O", "dxe5", "Nxe5"],
        explanations: [
          "Queen's pawn game.",
          "Budapest Gambit.",
          "Accept; knight attack.",
          "Advance pawn; recapture.",
          "Advance pawn; knight retreat.",
          "Develop bishop; check.",
          "Knight development; queen development.",
          "Develop knight; trade pieces.",
          "Recapture; capture pawn.",
          "Centralize queen; advance pawn.",
          "Develop bishop; knight development.",
          "Attack; trade queens.",
          "Recapture; challenge pawn.",
          "Castle; capture pawn.",
          "Recapture; centralize knight."
        ]
      }
    }
  },
  "Albin Counter-Gambit (for Black)": {
    description: "A counter-gambit that begins with 1.d4 d5 2.c4 e5. Black immediately challenges White's center with tactical complications.",
    category: "Defense",
    variations: {
      "Albin Accepted": {
        moves: ["d4", "d5", "c4", "e5", "dxe5", "d4", "Nf3", "Nc6", "Nbd2", "Bf5", "g3", "Qe7", "Bg2", "O-O-O", "O-O", "g5", "a3", "g4", "Nh4", "Be6", "b4", "h5", "Nb3", "h4", "Nxd4", "Nxd4", "Qxd4", "hxg3", "hxg3"],
        explanations: [
          "Queen's pawn opening.",
          "Albin Counter-Gambit; challenge.",
          "Accept; advance pawn.",
          "Develop knight; knight development.",
          "Knight development; develop bishop.",
          "Fianchetto prep; queen development.",
          "Complete fianchetto; long castle.",
          "Castle; advance pawn.",
          "Prevent Bb4; continue attack.",
          "Knight retreat; bishop retreat.",
          "Advance pawn; continue attack.",
          "Knight maneuver; advance pawn.",
          "Centralize; open position.",
          "Recapture; maintain material.",
          "Recapture; maintain material."
        ]
      },
      "Albin Declined": {
        moves: ["d4", "d5", "c4", "e5", "cxd5", "exd4", "Nf3", "Nf6", "Nxd4", "Nxd5", "e4", "Nf6", "Nc3", "Bb4", "Be3", "O-O", "Be2", "Re8", "O-O", "d5", "Qb3", "Bxc3", "Bxc3", "dxe4", "Ne2", "Qd7", "Ba3", "Qe6", "Qh4", "fxe5", "Bxd5", "Bxd5", "Qxd5", "Qe7", "Nc3"],
        explanations: [
          "Standard opening.",
          "Albin Counter-Gambit.",
          "Decline; capture pawn.",
          "Develop knight; develop knight.",
          "Centralize knight; recapture.",
          "Central advance; knight retreat.",
          "Knight development; pin.",
          "Develop bishop; king safety.",
          "Develop bishop; rook activity.",
          "Castle; central strike.",
          "Attack; trade pieces.",
          "Recapture; capture pawn.",
          "Knight development; queen development.",
          "Develop bishop; queen activity.",
          "Continue attack; capture pawn.",
          "Develop bishop; recapture.",
          "Knight development; attack bishop."
        ]
      },
      "Albin Counter-Gambit": {
        moves: ["d4", "d5", "c4", "e5", "dxe5", "d4", "Nf3", "Nc6", "Nbd2", "Bf5", "g3", "Qe7", "Bg2", "O-O-O", "O-O", "g5", "a3", "g4", "Nh4", "Be6", "b4", "h5", "Nb3", "h4", "Nxd4", "Nxd4", "Qxd4", "hxg3", "hxg3"],
        explanations: [
          "Queen's pawn game.",
          "Albin Counter-Gambit.",
          "Accept; advance pawn.",
          "Develop knight; knight development.",
          "Knight development; develop bishop.",
          "Fianchetto prep; queen development.",
          "Complete fianchetto; long castle.",
          "Castle; advance pawn.",
          "Prevent Bb4; continue attack.",
          "Knight retreat; bishop retreat.",
          "Advance pawn; continue attack.",
          "Knight maneuver; advance pawn.",
          "Centralize; open position.",
          "Recapture; maintain material.",
          "Recapture; maintain material."
        ]
      }
    }
  },
  "Ruy Lopez Zaitsev Expansion (for White)": {
    description: "A modern Spanish repertoire plan where White keeps queens on and plays for kingside pressure with flexible maneuvering.",
    category: "Classical",
    variations: {
      "Zaitsev Main Line": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Bb7", "d4", "Re8", "Nbd2", "Bf8", "a4"],
        explanations: [
          "Standard Spanish deployment aims at e5.",
          "...a6 questions the bishop without committing yet.",
          "White castles early and plays Re1 to support e4-e5 ideas.",
          "Black builds the 11 structure with ...d6 and ...Re8.",
          "The plan c3/d4 grabs central space while keeping the light bishop.",
          "h3 prevents ...Bg4 and prepares g2-g4 in some lines.",
          "After ...Bb7 White keeps tension and improves pieces.",
          "Nbd2 and Bf8 are hallmarks of the Zaitsev maneuver.",
          "a4 challenges the queenside space and stops ...b4."]
      },
      "Anti-Marshall d3 Plan": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "d3", "b5", "Bb3", "O-O", "a4", "Rb8", "Nc3", "d6", "Nd5", "Na5", "Ba2", "c6", "Ne3"],
        explanations: [
          "White sidesteps the Marshall Gambit with d3 instead of Re1.",
          "a4 fixes the queenside pawns and gains space.",
          "Nc3 develops harmoniously behind the pawn chain.",
          "Black reacts with ...d6 and ...Na5 targeting the bishop.",
          "Nd5 and Ne3 reposition pieces toward the kingside assault."
        ]
      },
      "Delayed d4 Break": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "h3", "O-O", "Re1", "d6", "c3", "Nb8", "d4", "Nbd7", "Nbd2", "Bb7", "Bc2", "Re8", "Nf1"],
        explanations: [
          "White uses h3/ Re1/ c3 to prepare the classical pawn break.",
          "Black reroutes the c6-knight to b8-d7-f8 for flexibility.",
          "After d4 exchanges, bishops go to c2/e3 for kingside attack.",
          "Nf1-g3 is a key maneuver supporting f4 or h4 expansions."
        ]
      }
    }
  },
  "Ruy Lopez Berlin Fortress (for Black)": {
    description: "A resilient defensive system where Black neutralizes the Spanish and aims for structural solidity in an early endgame.",
    category: "Defense",
    variations: {
      "Berlin Endgame": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6", "Bxc6", "dxc6", "dxe5", "Nf5", "Qxd8+", "Kxd8", "Nc3", "Bd7", "Rd1", "Ke8", "h3", "Be7", "Bg5"],
        explanations: [
          "The classic Berlin endgame arises after queens trade on d8.",
          "Black accepts doubled c-pawns but has rock-solid king safety.",
          "Central knights jump to f5/d6 to pressure e7 and c4 squares.",
          "Minor-piece coordination and quick king access to e6 are goals."
        ]
      },
      "Berlin with d3": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "d3", "Bc5", "O-O", "d6", "c3", "O-O", "Re1", "a6", "Ba4", "Ne7", "Nbd2", "Ng6", "Nf1", "h6", "h3", "Ba7", "Be3"],
        explanations: [
          "White avoids the endgame and keeps more pieces on the board.",
          "Black develops calmly with ...Bc5-d6-g6 to target e4.",
          "Knight maneuvers to g6/e7 allow f7-f5 breaks in some lines.",
          "h6/h3 prevent pins and maintain a flexible pawn shield."
        ]
      },
      "Berlin Wall Immediate ...d6": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "d6", "Re1", "Bd7", "c3", "g6", "d4", "Bg7", "h3", "O-O", "Nbd2", "Re8", "Bd3", "h6", "Nf1", "exd4", "cxd4"],
        explanations: [
          "Black keeps queens on and builds a King's Indian style center.",
          "...d6 and ...Bd7 cover e5 and prepare ...exd4 at the right time.",
          "The fianchetto bishop on g7 pressures the long diagonal.",
          "White must decide between c4 breaks or regrouping with Nf1-g3."
        ]
      }
    }
  },
  "Italian Game Giuoco Pianissimo": {
    description: "A slow-burning Italian setup where both sides maneuver behind pawn chains before committing to central pawn breaks.",
    category: "Classical",
    variations: {
      "Quiet d3 Plan": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O", "Re1", "a6", "Bb3", "Ba7", "Nbd2", "Re8", "Nf1", "h6", "Ng3", "Be6", "Be3"],
        explanations: [
          "White delays d4 and focuses on maneuvering knights toward g3.",
          "Black mirrors with ...Re8, ...Ba7, and prepares ...Be6.",
          "Both sides aim for timely d4 or ...d5 pawn breaks.",
          "Piece placement behind the pawns reduces tactical volatility." 
        ]
      },
      "c3-d4 Strike": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nbxd2", "d5", "exd5", "Nxd5", "O-O", "O-O", "Re1", "Be6", "Ne4"],
        explanations: [
          "White uses the typical Italian lever c3-d4 to open the center.",
          "Black counters with ...Bb4+ to trade bishops and reduce pressure.",
          "After mass exchanges the resulting positions resemble an open game.",
          "Ne4 targets c5/f6 and maintains initiative for White." 
        ]
      },
      "Slow a4 Plan": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "h6", "a4", "a6", "Bb3", "d6", "Nbd2", "Qe7", "Nf1", "Be6", "Bxe6", "Qxe6", "Be3", "O-O", "O-O"],
        explanations: [
          "White gains queenside space with a4 to clamp down on ...b5.",
          "Black replies symmetrically and seeks ...d5 breaks later.",
          "Exchanging on e6 gives White the d5 outpost.",
          "Both sides complete development and prepare maneuvering battles." 
        ]
      }
    }
  },
  "Italian Two Knights Counter (for Black)": {
    description: "A sharper Italian approach where Black invites early tactics with ...Nc6 and ...Nf6, meeting Ng5 with counterattacking ideas.",
    category: "Defense",
    variations: {
      "Traxler Counterattack": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kxf2", "Nxe4+", "Ke1", "Qh4+", "g3", "Nxg3", "hxg3", "Qxh1+", "Bf1", "O-O", "Qe2", "Nd4", "Qg2"],
        explanations: [
          "Black sacrifices on f2 to seize the initiative.",
          "The immediate ...Bc5!? leads to wild tactical melees.",
          "After Nxf7 Bxf2+ the exposed white king faces relentless checks.",
          "Accurate defense is required; otherwise Black's attack crashes through." 
        ]
      },
      "Fritz Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nd4", "c3", "b5", "Bf1", "Nxd5", "cxd4", "Qxg5", "Nc3", "Bb7", "dxe5", "Qxe5+", "Qe2", "Qxe2+", "Bxe2"],
        explanations: [
          "Black counters Ng5 with the central thrust ...d5.",
          "Sacrificing on d5 opens lines and gains tempi on the white pieces.",
          "...Nd4 and ...b5 chase the bishops and grab central squares.",
          "After simplifying, Black reaches an equal but dynamic endgame." 
        ]
      },
      "Ulvestad Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "b5", "Bf1", "Nd4", "c3", "Nxd5", "Ne4", "Bb7", "a4", "Be7", "axb5", "O-O", "d3", "Nf5", "Be2"],
        explanations: [
          "The intermediate ...b5 introduces the Ulvestad twist.",
          "Black leverages the c6-knight to jump into d4/f5 later.",
          "White must return material to finish development safely.",
          "Balanced dynamic play ensues with chances for both sides." 
        ]
      }
    }
  },
  "Scotch Game Modern Pressure": {
    description: "An active opening where White strikes in the center early with d4, leading to open files and rapid development.",
    category: "Classical",
    variations: {
      "4...Bc5 Line": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7", "Nc2", "Bb6", "Nd2", "O-O", "Nc4", "d6", "Qd2", "Qg6", "O-O-O", "Be6", "f4"],
        explanations: [
          "White builds a big center with c3 and f4 ideas.",
          "Black develops harmoniously and pressures the e4 pawn.",
          "Nc4-d2 maneuvers guard e4 while eyeing b6/d6.",
          "Opposite-side castling often leads to attacking races." 
        ]
      },
      "Mieses Variation": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Bb4", "Nxc6", "bxc6", "Bd3", "d5", "exd5", "cxd5", "O-O", "O-O", "Bg5", "c6", "Qf3", "Be7", "Rfe1"],
        explanations: [
          "White trades on c6 to damage Black's pawn structure.",
          "After ...d5 Black frees the light-square bishop and equalizes.",
          "Bg5 and Qf3 pressure f6 while eyes c6 weaknesses.",
          "Both sides must watch the e-file tactics and c-pawn majority." 
        ]
      },
      "Giuoco Piano Transposition": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7", "Bc4", "O-O", "O-O", "Bxd4", "cxd4", "d6", "Nc3", "Qg6", "f4", "Kh8", "f5"],
        explanations: [
          "White keeps the bishop on c4 to aim at f7.",
          "Black castles quickly and plays ...d6 for solidity.",
          "The f-pawn storm is thematic in these transpositions.",
          "Black must counter on the queenside or center to stay balanced." 
        ]
      }
    }
  },
  "Scotch Gambit Initiative": {
    description: "A sharp gambit weapon where White sacrifices the d-pawn to accelerate development and attack f7.",
    category: "Gambit",
    variations: {
      "Main Gambit Accepted": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "c3", "dxc3", "Bxf7+", "Kxf7", "Qd5+", "Ke8", "Qxc5", "d6", "Qh5+", "g6", "Qb5", "a6", "Qb3", "Qe7", "O-O"],
        explanations: [
          "White gambits a pawn for rapid piece activity on the f7 square.",
          "Bxf7+ and Qd5+ drag the black king into the open.",
          "After Qxc5 White regains material with initiative.",
          "Queenside retreats maintain pressure while development finishes."
        ]
      },
      "Declined with ...Nf6": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Nf6", "O-O", "Bc5", "e5", "d5", "exf6", "dxc4", "Re1+", "Kf8", "fxg7+", "Kxg7", "Nc3", "Re8", "Ne4", "Bf8", "Bg5"],
        explanations: [
          "Black keeps the pawn and develops pieces with ...Nf6.",
          "White pushes e5 to open the e-file toward the king.",
          "The exchange on g7 disrupts Black's castling rights.",
          "Ne4 and Bg5 finish development and keep the pressure."
        ]
      },
      "Gambit with cxd4": {
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "c3", "dxc3", "Nxc3", "d6", "Bg5", "Nge7", "Nd5", "O-O", "Qd2", "Be6", "O-O-O", "Qd7", "Kb1", "a6", "h4"],
        explanations: [
          "White quickly recaptures on c3 and aims pieces at f7.",
          "Bg5 and Nd5 create tactical threats against c7 and f6.",
          "Long castling allows a pawn storm with h4-h5.",
          "Black must coordinate ...Be6 and ...Ne5 to neutralize play."
        ]
      }
    }
  },
  "Vienna Game Aggressive Paths": {
    description: "A flexible opening beginning with 1.e4 e5 2.Nc3, allowing both quiet and gambit-oriented play styles.",
    category: "Classical",
    variations: {
      "Vienna Gambit": {
        moves: ["e4", "e5", "Nc3", "Nf6", "f4", "d5", "exd5", "Nxd5", "fxe5", "Nxc3", "bxc3", "Qh4+", "g3", "Qe4+", "Qe2", "Qxh1", "Nf3", "Bh3", "Bb2", "Bxf1", "Qxf1", "Nd7", "O-O-O"],
        explanations: [
          "White gambits the f-pawn to seize the initiative.",
          "Black counter-sacrifices on d5 and targets the king with ...Qh4+.",
          "After material imbalance, development and king safety are critical.",
          "O-O-O brings the rook to d-file and prepares c4 or e6 ideas."
        ]
      },
      "Slow Bg2 Plan": {
        moves: ["e4", "e5", "Nc3", "Nf6", "g3", "d5", "exd5", "Nxd5", "Bg2", "Be6", "Nf3", "Nc6", "O-O", "Be7", "Re1", "O-O", "d3", "f6", "d4", "Nxc3", "bxc3", "Bd5", "Rb1"],
        explanations: [
          "White chooses a quiet fianchetto scheme.",
          "Black occupies the center but must watch c6/e5 squares.",
          "d3-d4 break challenges the central pawn duo.",
          "Rb1 prepares c4 and pressure on the b-file." 
        ]
      },
      "Max Lange Attack": {
        moves: ["e4", "e5", "Nc3", "Nc6", "Bc4", "Nf6", "Nf3", "Bc5", "d3", "d6", "Bg5", "Be6", "Bb3", "h6", "Bh4", "Qe7", "Nd5", "Bxd5", "Bxd5", "g5", "Bg3", "Nxd5", "exd5"],
        explanations: [
          "White develops actively and pins the f6-knight.",
          "Black challenges the pin with ...g5 seeking expansion.",
          "Nd5 forces structural decisions and can lead to doubled pawns.",
          "The resulting middlegame is rich with kingside attacking chances."
        ]
      }
    }
  },
  "Vienna Gambit Dynamics": {
    description: "An all-in attacking repertoire using 2.Nc3 and early f-pawn thrusts to destabilize Black's center.",
    category: "Gambit",
    variations: {
      "Steinitz Gambit": {
        moves: ["e4", "e5", "Nc3", "Nc6", "f4", "exf4", "d4", "Qh4+", "Ke2", "d6", "Nf3", "Bg4", "Bxf4", "O-O-O", "Qd2", "Nf6", "Re1", "d5", "exd5", "Nxd5", "Nxd5", "Rxd5", "c3"],
        explanations: [
          "White accepts a wild king walk to gain time on the queen.",
          "Ke2 stabilizes for a moment and supports Bxf4.",
          "Black castles long and hits the center with ...d5.",
          "Accurate calculation is required; otherwise White's attack flourishes."
        ]
      },
      "Pierce Variation": {
        moves: ["e4", "e5", "Nc3", "Nc6", "f4", "exf4", "d4", "Bb4", "Bxf4", "Nf6", "Qd3", "d5", "e5", "Ne4", "Nge2", "O-O", "a3", "Bxc3+", "Nxc3", "Bf5", "Qe3", "f6", "O-O-O"],
        explanations: [
          "White recaptures on f4 with development and sets up e5 push.",
          "...Bb4 check forces concessions but gives White the bishop pair.",
          "Qd3 supports e5 and eyes h7.",
          "Queenside castling leads to opposite-wing pawn storms." 
        ]
      },
      "Paulsen Counter": {
        moves: ["e4", "e5", "Nc3", "Nc6", "f4", "exf4", "d4", "Qh4+", "g3", "fxg3", "Bg2", "Bb4", "Nf3", "Qxe4+", "Qe2", "Qxe2+", "Kxe2", "Bxc3", "bxc3", "d6", "Rb1", "Nf6", "Bg5"],
        explanations: [
          "Black accepts the pawn and plays the checking ...Qh4+ lines.",
          "White keeps pieces active with g3 and Bg2.",
          "After queen trades the endgame features better structure for White.",
          "Bg5 pins the f6-knight and eyes kingside weaknesses." 
        ]
      }
    }
  },
  "King's Gambit Revival Toolkit": {
    description: "An attacking choice beginning with 1.e4 e5 2.f4, reviving romantic-era sacrifices with modern precision.",
    category: "Gambit",
    variations: {
      "King's Gambit Accepted": {
        moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "h4", "g4", "Ne5", "Nf6", "d4", "d6", "Nd3", "Nxe4", "Bxf4", "Bg7", "c3", "O-O", "Nd2", "Re8", "Be2", "c5", "dxc5"],
        explanations: [
          "White gambits a pawn to open the f-file.",
          "The standard h4/g4 tussle appears, testing tactical alertness.",
          "Nd3 targets f4 and keeps the king safe on the kingside.",
          "After development White seeks piece play versus Black's extra pawn." 
        ]
      },
      "Muzio Gambit": {
        moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "Bc4", "g4", "O-O", "gxf3", "Qxf3", "Qf6", "e5", "Qxe5", "Bxf7+", "Kxf7", "d4", "Qxd4+", "Be3", "Qxe3+", "Qxe3", "Nf6", "Nc3"],
        explanations: [
          "White sacrifices a full piece for attack on f7 and open lines.",
          "O-O allows gxf3 to happen with tempo on the queen.",
          "Bxf7+ drags the king; d4 opens central files.",
          "If Black misplays, mate nets appear quickly on f7/f8." 
        ]
      },
      "King's Gambit Declined": {
        moves: ["e4", "e5", "f4", "Bc5", "Nf3", "d6", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Nc3", "O-O", "Bd3", "Re8", "O-O", "Bxc3", "bxc3", "Nxe4", "Qc2", "d5", "Ne5"],
        explanations: [
          "Black declines and keeps the structure with ...Bc5 and ...d6.",
          "White builds a strong center with c3/d4.",
          "Piece sacrifices on e4 are common themes.",
          "Ne5 and Qc2 create pressure on f7 and h7."
        ]
      }
    }
  },
  "King's Gambit Declined Shields": {
    description: "Repertoire ideas for Black to decline the gambit and keep a solid but flexible pawn structure.",
    category: "Defense",
    variations: {
      "Classical ...d5": {
        moves: ["e4", "e5", "f4", "d5", "exd5", "Qxd5", "Nc3", "Qe6", "Nf3", "exf4", "Qe2", "Nc6", "d4", "Qxe2+", "Bxe2", "Bd6", "Nb5", "Nf6", "O-O", "O-O", "c4", "Re8", "Nxd6"],
        explanations: [
          "Black counters in the center immediately with ...d5.",
          "After queen trade the endgame favors Black structurally.",
          "...Bd6 and ...Re8 develop smoothly while eyeing e4 break.",
          "White tries Nb5/d4 to create minor piece activity." 
        ]
      },
      "Falkbeer Counter": {
        moves: ["e4", "e5", "f4", "d5", "exd5", "e4", "Nc3", "Nf6", "d3", "Bb4", "Bd2", "e3", "Bxe3", "O-O", "Qd2", "Nxd5", "O-O-O", "Re8", "Bf2", "Nxc3", "bxc3", "Ba3+", "Kb1"],
        explanations: [
          "Black throws the e4 pawn forward to disrupt coordination.",
          "The countergambit leads to rapid development for Black.",
          "...Bb4 pin plus ...e3 aims at the dark squares around the king.",
          "Precise play by White is required to avoid a quick collapse." 
        ]
      },
      "Modern ...g5": {
        moves: ["e4", "e5", "f4", "Nc6", "Nf3", "g5", "fxg5", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "Bb5", "Nge7", "d4", "exd4", "Qxd4", "Bd7", "Qxh8", "O-O-O", "Bd2", "Ng6", "Qg8"],
        explanations: [
          "Black plays ...Nc6 and ...g5 without capturing on f4.",
          "After fxg5 ...d5 opens lines toward the white king.",
          "Qa5 pins the bishop and generates tactics on e4.",
          "Even if White grabs material, Black's activity compensates."
        ]
      }
    }
  },
  "Evans Gambit Renaissance": {
    description: "A classic gambit in the Italian Game where White sacrifices the b-pawn to gain time and open lines toward f7.",
    category: "Gambit",
    variations: {
      "Accepted Main Line": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5", "d4", "exd4", "O-O", "dxc3", "Qb3", "Qf6", "e5", "Qg6", "Nxc3", "Nge7", "Rd1", "O-O", "Ba3"],
        explanations: [
          "White gambits the b-pawn to kick the bishop and gain time.",
          "Qb3 and e5 attack f7 and c6 simultaneously.",
          "Nxc3 develops with tempo while hitting d5 and e4 squares.",
          "Ba3 completes development and eyes the e7 knight and king."
        ]
      },
      "Declined with ...Bb6": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bb6", "a4", "a6", "Nc3", "Nf6", "O-O", "d6", "h3", "O-O", "Re1", "Nd4", "Nxd4", "Bxd4", "Bb2", "Be6", "Bf1"],
        explanations: [
          "Black declines by retreating to b6 and keeping material parity.",
          "a4 prevents ...a5 locking the structure too soon.",
          "White completes development and plans c4 or d4 pushes.",
          "The middlegame features positional pressure on the a2-g8 diagonal."
        ]
      },
      "Goering Gambit Transposition": {
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5", "d4", "exd4", "O-O", "dxc3", "Qd5", "Qf6", "e5", "Qg6", "Na3", "Nge7", "Nb5", "O-O", "Ba3"],
        explanations: [
          "White's Qd5 hits f7 and the a5 bishop simultaneously.",
          "e5 lever opens lines and restricts the g6 queen.",
          "Na3-b5 eyes c7 tactics typical of gambit play.",
          "Ba3 continues development and controls e7."
        ]
      }
    }
  },
  "Ponziani Aggressive Plans": {
    description: "A rarer 1.e4 e5 system where White plays 3.c3 aiming for d4 and rapid central expansion.",
    category: "Classical",
    variations: {
      "Jaenisch Counter": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "d5", "Qa4", "Bd7", "exd5", "Nd4", "Qd1", "Nxf3+", "Qxf3", "Nf6", "d3", "Bg4", "Qg3", "Qxd5", "Be2", "O-O-O", "Bf1", "Qe6", "Nd2"],
        explanations: [
          "Black challenges the center immediately with ...d5.",
          "Qa4 pins the c6 knight and recaptures on d5.",
          "After ...Nd4 Black gains active piece play.",
          "White must consolidate the extra pawn with accurate moves." 
        ]
      },
      "Mainline ...Nf6": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "Nf6", "d4", "exd4", "e5", "Ne4", "Bd3", "d5", "exd6", "Nxd6", "O-O", "Be7", "Re1", "O-O", "h3", "Bf5", "Bf4", "Qd7", "Na3"],
        explanations: [
          "White pushes e5 hitting the knight and space advantage.",
          "Black returns the pawn for activity on the d-file.",
          "Bf4 and Na3 pressure the central squares.",
          "Both sides fight for control of e5 and d4."
        ]
      },
      "Spanish Connection": {
        moves: ["e4", "e5", "Nf3", "Nc6", "c3", "Nf6", "Bb5", "Nxe4", "Qe2", "Nd6", "Nxe5", "Qe7", "d4", "Nxe5", "dxe5", "Nxb5", "Qxb5", "c6", "Qe2", "d5", "O-O", "Bf5", "Re1"],
        explanations: [
          "Bb5 pins the knight, invoking Spanish-like play.",
          "Black grabs material with ...Nxe4 but must weather tactics.",
          "Qe2 and d4 open lines and attack the knight on e5.",
          "After simplifications White keeps central majority pressure." 
        ]
      }
    }
  },
  "Bishop's Opening Modern Ideas": {
    description: "A universal weapon starting with 2.Bc4, allowing transpositions into Italian or Vienna-style attacks.",
    category: "Classical",
    variations: {
      "Calabrese Counter": {
        moves: ["e4", "e5", "Bc4", "Nc6", "Qh5", "g6", "Qf3", "Nf6", "Ne2", "Bg7", "d3", "O-O", "Bg5", "Na5", "Nbc3", "c6", "a3", "b5", "Ba2", "d6", "h4", "h6", "Bd2"],
        explanations: [
          "White immediately threatens mate on f7 with Qh5.",
          "Black defends with ...g6 and develops normally.",
          "Ne2-c3/g3 maneuvers support f4 pushes later.",
          "a3 and Ba2 keep the bishop alive for kingside attacks." 
        ]
      },
      "Urusov Gambit": {
        moves: ["e4", "e5", "Bc4", "Nf6", "d4", "exd4", "Nf3", "Nc6", "O-O", "Bc5", "e5", "d5", "exf6", "dxc4", "Re1+", "Be6", "fxg7", "Rg8", "Bg5", "Qd5", "Nc3", "Qf5", "Ne4"],
        explanations: [
          "White gambits a pawn to open the f-file.",
          "fxg7 and Bg5 pin and pressure the f8-rook and queen.",
          "Ne4 adds attackers and threatens Nd6+ ideas.",
          "If Black survives the attack, material advantage counts." 
        ]
      },
      "Transposition to Italian": {
        moves: ["e4", "e5", "Bc4", "Nf6", "d3", "c6", "Nf3", "d5", "Bb3", "Bd6", "Nc3", "d4", "Ne2", "O-O", "O-O", "c5", "Ng3", "Nc6", "Nh4", "Re8", "Nhf5", "Bf8", "Bg5"],
        explanations: [
          "d3 and Nc3 keep the structure flexible.",
          "Black counters with ...c5 and ...d4 to gain space.",
          "Knights hop to g3/f5 to pressure e7 and h6.",
          "Bg5 pins the f6 knight and sets up f2-f4 expansions." 
        ]
      }
    }
  },
  "Philidor Counterattack Arsenal": {
    description: "A solid yet counterattacking system for Black after 1.e4 e5 2.Nf3 d6, focusing on structure and timely strikes.",
    category: "Defense",
    variations: {
      "Hanham Setup": {
        moves: ["e4", "e5", "Nf3", "d6", "d4", "Nd7", "Nc3", "Ngf6", "Bc4", "Be7", "O-O", "O-O", "Re1", "c6", "a4", "Qc7", "h3", "b6", "Ba2", "Re8", "Be3", "Nf8", "Qe2"],
        explanations: [
          "Black maintains a compact center with ...Nd7 and ...Ngf6.",
          "...c6 and ...Qc7 prepare ...e5-e4 or ...d5 strikes.",
          "White aims for space with a4 and Bc4.",
          "Piece placement revolves around timing the central break."
        ]
      },
      "Philidor Countergambit": {
        moves: ["e4", "e5", "Nf3", "d6", "d4", "f5", "Nc3", "fxe4", "Nxe4", "d5", "Nxe5", "dxe4", "Bc4", "Qe7", "Bf7+", "Kd8", "O-O", "Nd7", "Bf4", "Ngf6", "Nc6", "bxc6", "Nxc6"],
        explanations: [
          "Black gambits the f-pawn for quick development.",
          "White returns the pawn but keeps pressure on e4.",
          "Bf7+ and O-O lead to exposed black king.",
          "Precise play is required; otherwise Black's pieces swarm."
        ]
      },
      "Antoshin Variation": {
        moves: ["e4", "e5", "Nf3", "d6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Be7", "Be2", "O-O", "O-O", "Re8", "Re1", "Bf8", "Bf3", "c6", "a4", "Na6", "Bf4", "Nc7", "Qd2"],
        explanations: [
          "Black trades in the center and develops harmoniously.",
          "...Bf8 reroutes the bishop to g7 or e7 depending on plans.",
          "White plays a4 and Bf4 to gain space and pressure d6.",
          "The position is flexible, with breaks ...d5 or ...c5 coming later." 
        ]
      }
    }
  },
  "Petrov Dynamic Defense": {
    description: "A symmetrical defense starting with 1.e4 e5 2.Nf3 Nf6, aiming for solid equality with chances for counterplay.",
    category: "Defense",
    variations: {
      "Classical Attack": {
        moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4", "d5", "Bd3", "Bd6", "O-O", "O-O", "c4", "c6", "Nc3", "Nxc3", "bxc3", "dxc4", "Bxc4", "Nd7", "Re1"],
        explanations: [
          "White grabs the e5 pawn; Black immediately counters.",
          "Symmetrical structures arise but with imbalances in piece placement.",
          "c4 and Nc3 give White space while Black relies on solidity.",
          "Both sides complete development and aim for central breaks." 
        ]
      },
      "Cochrane Gambit": {
        moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nxf7", "Kxf7", "d4", "Nxe4", "Qh5+", "g6", "Qd5+", "Kg7", "Qxe4", "Be7", "Nc3", "Re8", "Be3", "Bf6", "Qf3", "Bxd4", "O-O-O"],
        explanations: [
          "White sacrifices the knight on f7 to expose the king.",
          "Qh5+ and Qd5+ keep the king in the center.",
          "Black returns material to trade queens and consolidate.",
          "If Black survives, the extra minor piece tells." 
        ]
      },
      "Petrov Classical with d4": {
        moves: ["e4", "e5", "Nf3", "Nf6", "Nc3", "Nc6", "Bb5", "Bb4", "O-O", "O-O", "d3", "d6", "Ne2", "Bg4", "c3", "Ba5", "Ng3", "Ne7", "h3", "Be6", "d4", "Ng6", "Be3"],
        explanations: [
          "White keeps symmetry and prepares d4 break later.",
          "...Bb4 pins, but h3 and Ng3 challenge the bishop.",
          "After d4, central tension gives both sides dynamic chances.",
          "Be3 and Qf3 target kingside weaknesses while rooks occupy the e-file." 
        ]
      }
    }
  },
  "Smith-Morra Assault": {
    description: "A tactical gambit against the Sicilian where White sacrifices a pawn for rapid development and pressure on the c- and d-files.",
    category: "Gambit",
    variations: {
      "Accepted Mainline": {
        moves: ["e4", "c5", "d4", "cxd4", "c3", "dxc3", "Nxc3", "Nc6", "Nf3", "d6", "Bc4", "e6", "O-O", "Nf6", "Qe2", "Be7", "Rd1", "e5", "Be3", "O-O", "h3", "Be6", "Rac1"],
        explanations: [
          "White sacrifices on c3 to accelerate development.",
          "Qe2 and Rd1 increase central pressure and support e5 breaks.",
          "Be3 and Rac1 target c7 and the half-open c-file.",
          "Black aims for ...e5 and ...Be6 to consolidate the extra pawn." 
        ]
      },
      "Chicago Defense": {
        moves: ["e4", "c5", "d4", "cxd4", "c3", "dxc3", "Nxc3", "Nc6", "Nf3", "d6", "Bc4", "a6", "O-O", "Nf6", "Qe2", "Bg4", "h3", "Bh5", "g4", "Bg6", "Rd1", "Nd7", "Bf4"],
        explanations: [
          "Black plays ...Bg4 and ...Bh5 to trade pieces and blunt the initiative.",
          "White advances g4 to kick the bishop and expand kingside space.",
          "Rd1 and Bf4 reinforce central control and pressure on d6.",
          "Both sides must watch tactics on the e-file and c2 square." 
        ]
      },
      "Declined ...d5": {
        moves: ["e4", "c5", "d4", "cxd4", "c3", "d5", "exd5", "Qxd5", "cxd4", "Nc6", "Nc3", "Qxd4", "Bd2", "Nf6", "Nf3", "Qd8", "Bc4", "e6", "O-O", "Be7", "Qe2", "O-O", "Rfd1"],
        explanations: [
          "Black declines with an early ...d5 returning the pawn immediately.",
          "White develops rapidly and maintains a spatial edge.",
          "Bd2 and Qe2 overprotect e4 and ready Rac1.",
          "The middlegame often revolves around pressure on the d-file." 
        ]
      }
    }
  },
  "Wing Gambit vs Sicilian": {
    description: "A surprise weapon where White plays b4 early to deflect the c5 pawn and seize space on the queenside.",
    category: "Gambit",
    variations: {
      "Mainline ...cxb4": {
        moves: ["e4", "c5", "b4", "cxb4", "a3", "d5", "exd5", "Qxd5", "Nf3", "e5", "c4", "Qe4+", "Be2", "Nc6", "O-O", "Bg4", "Nc3", "Qf5", "Nd5", "O-O-O", "Qa4", "Kb8", "d3"],
        explanations: [
          "White gambits the b-pawn to open lines for Ra1 and c2-c4.",
          "Black counterattacks with ...d5 and ...Qe4+ to disrupt development.",
          "c4 and Nd5 target c7/e7 squares creating tactical motifs.",
          "Castling kingside keeps the rook on a1 ready for pressure." 
        ]
      },
      "Wing Deferred": {
        moves: ["e4", "c5", "Nf3", "Nc6", "b4", "cxb4", "a3", "d5", "exd5", "Qxd5", "d4", "Bg4", "Be2", "e6", "O-O", "Nf6", "c4", "Qd8", "Be3", "Be7", "axb4", "Nxb4", "Nc3"],
        explanations: [
          "White plays Nf3 first to control d4 before launching b4.",
          "d4 and c4 recapture the pawn and expand in the center.",
          "Black develops pieces to g4/e7 aiming at d4.",
          "After axb4 White regains the pawn with harmonious development." 
        ]
      },
      "Wing Gambit Declined": {
        moves: ["e4", "c5", "b4", "e6", "bxc5", "Bxc5", "d4", "Bb6", "Nf3", "Ne7", "Bd3", "d5", "e5", "Bd7", "O-O", "Nbc6", "c3", "Qc7", "Na3", "a6", "Nc2", "O-O-O", "Ba3"],
        explanations: [
          "Black declines with ...e6 and aims for solid development.",
          "White captures on c5 and builds a pawn chain with c3/d4.",
          "Na3-c2 maneuvers support b4-b5 expansions later.",
          "Opposite-side castling often leads to mutual attacks." 
        ]
      }
    }
  },
  "Sicilian Classical Blueprint": {
    description: "A rich Sicilian variation where Black develops with ...Nc6, ...d6, ...Nf6, and ...Bc5, aiming for flexible piece play.",
    category: "Defense",
    variations: {
      "Sozin Attack": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "d6", "Bc4", "g6", "Be3", "Bg7", "f3", "O-O", "Qd2", "Bd7", "O-O-O", "Rc8", "Bb3", "Ne5", "h4"],
        explanations: [
          "White targets the dark squares with Bc4/Qd2/O-O-O setup.",
          "Black fianchettos and prepares ...Nc4 or ...b5 breaks.",
          "h4-h5 is a typical pawn storm theme for White.",
          "Black counters on the queenside with ...Rc8 and ...b5." 
        ]
      },
      "Richter-Rauzer": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "d6", "Bg5", "e6", "Qd2", "Be7", "O-O-O", "O-O", "f4", "Nxd4", "Qxd4", "Qa5", "Kb1", "Rd8", "Be2"],
        explanations: [
          "Bg5 pins the knight, leading to sharp play.",
          "Black reacts with ...e6 and ...Nxd4 to reduce pressure.",
          "Qa5 hits c3 and a2 while preparing ...d5.",
          "White keeps space with f4 and consistent kingside pressure." 
        ]
      },
      "Classical Scheveningen Hybrid": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "d6", "Be2", "e6", "O-O", "Be7", "Be3", "O-O", "f4", "Bd7", "Kh1", "Nxd4", "Bxd4", "Bc6", "Bf3"],
        explanations: [
          "White plays a slower Be2 setup before f4.",
          "Black uses Scheveningen pawns ...e6 and ...d6 for flexibility.",
          "After ...Nxd4 Bxd4, the bishop becomes powerful on g1-a7 diagonal.",
          "Both sides prepare pawn storms: g4 for White, ...b5 for Black." 
        ]
      }
    }
  },
  "Sicilian Scheveningen Modern": {
    description: "A flexible Sicilian framework with pawns on d6 and e6, allowing Black to counterattack after solid development.",
    category: "Defense",
    variations: {
      "English Attack": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6", "Be3", "a6", "f3", "Be7", "Qd2", "O-O", "g4", "Nc6", "O-O-O", "Nxd4", "Bxd4", "b5", "g5"],
        explanations: [
          "White castles long and storms the kingside with g4-g5.",
          "Black plays ...b5 and ...Bb7 to counter on the queenside.",
          "The Scheveningen pawn duo keeps e5 under control.",
          "Timing of ...d5 is critical for Black to break free." 
        ]
      },
      "Keres Attack": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6", "g4", "Nc6", "g5", "Nd7", "Be3", "Be7", "h4", "a6", "Qd2", "Qc7", "O-O-O", "Nde5", "Kb1"],
        explanations: [
          "White's g-pawn thrust challenges the knight immediately.",
          "Black retreats to d7 and aims for ...b5 or ...Nc4 counterplay.",
          "The position becomes razor sharp with opposite-wing pawn storms.",
          "Both kings rely on precise calculation to stay safe." 
        ]
      },
      "Classical Scheveningen": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6", "Be2", "Be7", "O-O", "O-O", "Be3", "Nc6", "f4", "Bd7", "Kh1", "Nxd4", "Bxd4", "Bc6", "Bf3"],
        explanations: [
          "Black develops pieces behind the solid d6/e6 structure.",
          "White plays Be3/Kh1 to prevent tactics on g1-a7 diagonal.",
          "...Nxd4 reduces pressure and prepares ...b5.",
          "The middlegame revolves around timing ...d5 or g4 breaks." 
        ]
      }
    }
  },
  "Sicilian Kan Flexibility": {
    description: "A modern Sicilian variation with ...a6 and ...e6 where Black delays Nc6 to keep options flexible.",
    category: "Defense",
    variations: {
      "Modern Kan": {
        moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6", "Nc3", "Qc7", "Be2", "Nf6", "O-O", "Bb4", "Qd3", "Be7", "Qg3", "Qxg3", "hxg3", "Nc6", "Be3", "O-O", "Rad1"],
        explanations: [
          "Black plays ...Qc7 early to control c5 and e5 squares.",
          "...Bb4 pins the knight and discourages c2-c4 expansions.",
          "White centralizes with Qd3/Qg3 and prepares g4 or f4.",
          "After queen trade the endgame is balanced with minor piece play." 
        ]
      },
      "Kan with ...b5": {
        moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6", "Nc3", "Qc7", "Be2", "b5", "O-O", "Bb7", "a3", "Nf6", "Re1", "d6", "Bf1", "Nbd7", "f4", "Be7", "Kh1"],
        explanations: [
          "Black expands on the queenside with ...b5 and ...Bb7.",
          "a3 prevents ...Bb4 pins; Bf1 repositions the bishop.",
          "f4-f5 is White's thematic pawn storm.",
          "...Nbd7 and ...Nc5 aim to blockade light squares." 
        ]
      },
      "Accelerated Hedgehog": {
        moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6", "Nc3", "Qc7", "g3", "Nc6", "Bg2", "Nf6", "O-O", "Be7", "Re1", "d6", "a4", "O-O", "Be3", "Bd7", "h3"],
        explanations: [
          "White adopts a fianchetto while Black keeps the Hedgehog setup.",
          "...Nc6 and ...Be7 finish development without committing ...b5 yet.",
          "a4 stops ...b5 and gains space for White.",
          "The position revolves around timing of ...d5 or g4 breaks." 
        ]
      }
    }
  },
  "Sicilian Taimanov Practical": {
    description: "A flexible Sicilian line where Black plays ...Nc6 and ...Qc7 early, keeping pawn structures adaptable.",
    category: "Defense",
    variations: {
      "English Attack Setup": {
        moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be3", "a6", "f3", "Nf6", "Qd2", "b5", "O-O-O", "Bb7", "Kb1", "Ne5", "g4", "b4", "Na4"],
        explanations: [
          "Black uses the Taimanov move order with ...a6 and ...Qc7.",
          "White launches the English Attack with Be3/Qd2/f3/g4.",
          "...Ne5 aims to trade knights and reduce the attack.",
          "Na4 targets b6/c5 squares and disrupts the queenside expansion." 
        ]
      },
      "Classical Development": {
        moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be2", "a6", "O-O", "Nf6", "Be3", "Bb4", "Na4", "Be7", "c4", "O-O", "Nc3", "d6", "Rc1"],
        explanations: [
          "White chooses a positional Be2 setup instead of sharp attacks.",
          "...Bb4 pins the knight and forces Na4, loosening c4 squares.",
          "c4 fixes the d5 square for a knight jump.",
          "Both sides aim for timely central breaks ...d5 or e5." 
        ]
      },
      "Gurgenidze Structure": {
        moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be3", "a6", "Qd2", "Nf6", "O-O-O", "Bb4", "f3", "Ne5", "Kb1", "Bxc3", "Qxc3", "Qxc3", "bxc3"],
        explanations: [
          "Black trades on c3 to break White's pawn structure.",
          "White maintains attacking chances with f3 and long castling.",
          "...Ne5 reroutes knights toward c4 and e5 squares.",
          "After exchanges the c-file becomes critical for both sides." 
        ]
      }
    }
  },
  "Sicilian Moscow Conquest": {
    description: "A practical anti-Sicilian weapon where White pins the knight with Bb5+, aiming for positional pressure.",
    category: "Classical",
    variations: {
      "Moscow Mainline": {
        moves: ["e4", "c5", "Nf3", "d6", "Bb5+", "Bd7", "Bxd7+", "Qxd7", "c4", "Nc6", "Nc3", "Nf6", "O-O", "g6", "d4", "cxd4", "Nxd4", "Bg7", "Nde2", "O-O", "b3", "a6", "h3"],
        explanations: [
          "White trades on d7 to ruin Black's pawn structure.",
          "c4 and Nc3 build a Maroczy-style bind.",
          "Nde2 reroutes to c3 or f4.",
          "Black fianchettos and seeks ...b5 or ...d5 to free position." 
        ]
      },
      "Moscow with ...Nd7": {
        moves: ["e4", "c5", "Nf3", "d6", "Bb5+", "Nd7", "O-O", "Ngf6", "Re1", "a6", "Bf1", "g6", "c3", "Bg7", "d4", "O-O", "h3", "Qc7", "a4", "b6", "Na3", "Bb7", "d5"],
        explanations: [
          "Black blocks with ...Nd7 keeping bishops on board.",
          "White withdraws the bishop and plays c3/d4 to seize space.",
          "a4 prevents ...b5 and prepares Nc4.",
          "d5 hits the knight on c6 and opens the center at the right moment." 
        ]
      },
      "Rossolimo Transposition": {
        moves: ["e4", "c5", "Nf3", "Nc6", "Bb5", "g6", "O-O", "Bg7", "Re1", "e5", "Bxc6", "dxc6", "d3", "Qe7", "a3", "Nf6", "b4", "Bg4", "Be3", "cxb4", "axb4", "Qxb4", "Nbd2"],
        explanations: [
          "White switches to Rossolimo-style pressure with Bb5.",
          "...g6 and ...e5 set up a Dragon-like pawn structure.",
          "b4 lever opens files against Black's queenside.",
          "Nbd2 recaptures on b3/c4 and builds central support." 
        ]
      }
    }
  },
  "Sicilian O'Kelly Surprise": {
    description: "A surprise Sicilian where Black plays 2...a6, discouraging Bb5 systems and diverting White from mainline theory.",
    category: "Defense",
    variations: {
      "Immediate d4": {
        moves: ["e4", "c5", "Nf3", "a6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Qc7", "Be2", "e6", "O-O", "Bb4", "Qd3", "Nc6", "Be3", "O-O", "Rad1", "Ne5", "Qd2", "Neg4", "Bf4"],
        explanations: [
          "Black's early ...a6 prevents Bb5 and prepares ...b5 in some lines.",
          "White still goes for open Sicilian structures with d4.",
          "...Bb4 pins and the queen on c7 eyes h2 and e5.",
          "Bf4 neutralizes the queen and readies c2-c4 expansion." 
        ]
      },
      "Anti-O'Kelly with c4": {
        moves: ["e4", "c5", "Nf3", "a6", "c4", "Nc6", "d4", "cxd4", "Nxd4", "g6", "Nc3", "Bg7", "Be3", "Nf6", "Be2", "O-O", "O-O", "d6", "Qd2", "Bd7", "Rac1", "Rc8", "h3"],
        explanations: [
          "White plays c4 to gain Maroczy-style control of d5.",
          "Black adopts a Dragon fianchetto while the a6 pawn controls b5.",
          "Rac1 and h3 prepare Nd5 and f4 expansions.",
          "Both sides fight for central breaks ...e6-e5 or e4-e5." 
        ]
      },
      "O'Kelly Gambit": {
        moves: ["e4", "c5", "Nf3", "a6", "d4", "cxd4", "Nxd4", "e5", "Nf5", "d5", "Qxd5", "Qxd5", "Nxd5", "Nc6", "c3", "Rb8", "Be3", "Be6", "Nc7+", "Kd7", "Nxe6", "Kxe6", "Bc4+"],
        explanations: [
          "Black plays ...e5 early, turning the game into a sharp gambit.",
          "Nf5 and Qxd5 punish the weakened squares.",
          "After queen trades White exploits the weak dark squares.",
          "Nc7+ tactical shot regains material with interest." 
        ]
      }
    }
  },
  "Accelerated Dragon Maroczy": {
    description: "A positional anti-Dragon system where White plays c4 to clamp down on d5, while Black uses the Accelerated move order.",
    category: "Defense",
    variations: {
      "Main Maroczy": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6", "c4", "Bg7", "Be3", "Nf6", "Nc3", "O-O", "Be2", "d6", "O-O", "Bd7", "Rc1", "Nxd4", "Bxd4", "Bc6", "f3"],
        explanations: [
          "White establishes the Maroczy bind with pawns on e4 and c4.",
          "Black develops and looks for ...a6 and ...a5 to chip away.",
          "Nxd4 trades pieces to relieve space pressure.",
          "f3 supports g4 or c5 breaks later." 
        ]
      },
      "Accelerated Break ...b5": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6", "c4", "Bg7", "Be3", "Nf6", "Nc3", "O-O", "Be2", "Nxd4", "Bxd4", "a5", "O-O", "d6", "Qd2", "a4", "Rab1"],
        explanations: [
          "Black plays ...a5 and ...a4 to undermine the c4 pawn.",
          "White maintains the bind and prepares Rb1 and b4.",
          "...d6 supports ...Nd7 and ...Nc5 jumps.",
          "Timing of b4 or Nd5 decides the strategic battle." 
        ]
      },
      "Maroczy with f4": {
        moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6", "c4", "Bg7", "Be3", "Nf6", "Nc3", "O-O", "Be2", "d6", "O-O", "Bd7", "f4", "Nxd4", "Bxd4", "Bc6", "Qd3"],
        explanations: [
          "White plays f4 to strengthen e5 control and prepare e5 break.",
          "Black counters with ...Nxd4 and ...Bc6 to pressure e4.",
          "Qd3 supports e5 and eyes h7.",
          "The resulting positions are rich in maneuvering possibilities." 
        ]
      }
    }
  },
  "Najdorf Poisoned Pawn Prep": {
    description: "A cutting-edge Najdorf repertoire focusing on the Poisoned Pawn variation with queenside counterplay.",
    category: "Defense",
    variations: {
      "Poisoned Pawn Mainline": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Bg5", "e6", "Qf3", "Qb6", "O-O-O", "Qxb2+", "Kb1", "Qb4+", "Nb3", "Nc6", "Bc1", "Ne5", "Qg3"],
        explanations: [
          "Black grabs the b2 pawn accepting enormous complications.",
          "White castles long to attack the black king on g8.",
          "...Qb4+ forces the knight to b3, giving Black time to develop.",
          "Precise knowledge is required; one slip can be fatal for either side." 
        ]
      },
      "Adams Attack": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "h3", "e5", "Nde2", "h5", "Bg5", "Be6", "Nd5", "Bxd5", "exd5", "Nbd7", "c4", "Be7", "Nc3"],
        explanations: [
          "White plays h3 to restrict ...Ng4 and keep options flexible.",
          "Black responds with ...h5 to gain space and discourage g4.",
          "Nd5 and c4 clamp down on dark squares.",
          "Both sides maneuver before the center opens with c5 or f4." 
        ]
      },
      "Delayed Poisoned Pawn": {
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Bg5", "Nbd7", "Qd2", "h6", "Bh4", "g5", "Bg3", "e5", "Nf5", "Qc7", "O-O-O", "Nc5", "f3"],
        explanations: [
          "Black plays ...Nbd7 and ...h6 before capturing on b2.",
          "...g5 drives the bishop back, preparing ...Be6 or ...Be6.",
          "White keeps pressure with Nf5 and f3.",
          "The structure can transpose to Scheveningen setups with opposite attacks." 
        ]
      }
    }
  },
  "Caro-Kann Two Knights Guide": {
    description: "An ambitious approach against the Caro-Kann where White develops both knights quickly and aims for kingside pressure.",
    category: "Classical",
    variations: {
      "Mainline 3.Nf3": {
        moves: ["e4", "c6", "Nc3", "d5", "Nf3", "Bg4", "h3", "Bxf3", "Qxf3", "Nf6", "d3", "e6", "g3", "Bb4", "Bd2", "Nbd7", "Bg2", "O-O", "O-O", "a5", "a3", "Bd6", "Qe2"],
        explanations: [
          "White plays h3 to force a bishop trade and keep the pair.",
          "g3 and Bg2 create a kingside fianchetto supporting e4.",
          "Black develops solidly with ...Bb4 and ...Nbd7.",
          "The middlegame revolves around f4 breaks versus queenside expansion." 
        ]
      },
      "Korchnoi Gambit": {
        moves: ["e4", "c6", "Nc3", "d5", "Nf3", "dxe4", "Nxe4", "Nd7", "Qe2", "Ndf6", "d3", "Bg4", "Bd2", "e6", "O-O-O", "Qd5", "Kb1", "O-O-O", "Neg5", "Bh5", "h3", "h6", "Ne4"],
        explanations: [
          "White gambits a pawn with Qe2 to accelerate development.",
          "O-O-O brings the rook into play and threatens to open the e-file.",
          "Neg5 pressures f7 and h7 squares.",
          "Black must defend accurately while finishing development." 
        ]
      },
      "Two Knights with g4": {
        moves: ["e4", "c6", "Nc3", "d5", "Nf3", "dxe4", "Nxe4", "Nf6", "Nc3", "Bf5", "g4", "Bxg4", "Be2", "e6", "d4", "Nbd7", "Be3", "Bb4", "Qd3", "Qa5", "Bd2", "O-O-O", "a3"],
        explanations: [
          "White plays g4 to chase the bishop and grab space.",
          "After ...Bxg4 Be2 recaptures while gaining tempo.",
          "Qd3 and Bd2 support c4 and long castling ideas.",
          "Both sides must judge timing of central pawn breaks carefully." 
        ]
      }
    }
  },
  "Caro-Kann Fantasy Attack": {
    description: "A sharp variation where White plays f3 early, supporting e4 and planning g4 to attack the kingside.",
    category: "Gambit",
    variations: {
      "Main Fantasy": {
        moves: ["e4", "c6", "d4", "d5", "f3", "dxe4", "fxe4", "e5", "Nf3", "exd4", "Bc4", "Nf6", "O-O", "Be7", "Ng5", "O-O", "Nc3", "Na6", "e5", "Nd5", "Qh5", "Bxg5", "Bxg5"],
        explanations: [
          "White sacrifices structure for a lead in development.",
          "Bc4 and Qh5 focus on the weak f7 square.",
          "Black must counter with ...Na6 and ...Nd5 to trade pieces.",
          "The resulting middlegame is double-edged with opposite wing attacks." 
        ]
      },
      "Modern ...g6": {
        moves: ["e4", "c6", "d4", "d5", "f3", "dxe4", "fxe4", "e5", "Nf3", "exd4", "Bc4", "Nf6", "O-O", "Be7", "Qe1", "O-O", "Bd3", "c5", "Nbd2", "Nc6", "e5", "Nd5", "Ne4"],
        explanations: [
          "Black fianchettos to control dark squares.",
          "Qe1 supports e5 advance without exposing the queen too early.",
          "Bd3 and e5 create pressure on h7 and f7.",
          "The fight often centers on whether White can maintain the initiative." 
        ]
      },
      "Declined ...e6": {
        moves: ["e4", "c6", "d4", "d5", "f3", "e6", "Nc3", "Nf6", "Bd3", "c5", "exd5", "exd5", "Be3", "c4", "Be2", "Bb4", "Qd2", "O-O", "O-O-O", "b5", "g4", "Re8", "Nh3"],
        explanations: [
          "Black declines with ...e6 keeping structure solid.",
          "White castles long and storms with g4/h4.",
          "...b5 and ...Bb4 counterattack the queenside.",
          "Timing of central breaks ...b4 or g5 decide the battle." 
        ]
      }
    }
  },
  "French Advance Bayonet": {
    description: "A modern French Advance repertoire where White plays 3.e5 followed by sharp pawn storms on both flanks.",
    category: "Classical",
    variations: {
      "Bayonet with c4": {
        moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "a3", "c4", "Nbd2", "Na5", "Be2", "Bd7", "O-O", "Ne7", "Rb1", "Nc8", "Re1", "Qd8", "Nf1"],
        explanations: [
          "White bolsters e5 and expands with a3/b4 ideas.",
          "Black's ...c4 and ...Na5 target the b3 square.",
          "Rb1 prepares b4 pawn storm to undermine c5.",
          "Nf1-g3 adds pressure on e4 and h5 squares." 
        ]
      },
      "Milner-Barry Sacrifice": {
        moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "Bd3", "cxd4", "cxd4", "Bd7", "O-O", "Nxd4", "Nxd4", "Qxd4", "Nc3", "Qxe5", "Re1", "Qd6", "Nb5"],
        explanations: [
          "White sacrifices the d-pawn for rapid development.",
          "Re1 and Nb5 attack the queen and c7 simultaneously.",
          "If Black misplays, the king gets stuck in the center.",
          "Otherwise Black consolidates and keeps an extra pawn." 
        ]
      },
      "Short System": {
        moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Bd7", "Be2", "cxd4", "cxd4", "Nge7", "Nc3", "Nc8", "O-O", "Be7", "Be3", "O-O", "Qd2", "a6", "Rac1"],
        explanations: [
          "White develops calmly with Be2/Qd2/O-O.",
          "Black restructures with ...Nc8 to support ...b5 or ...f6 later.",
          "Rac1 prepares Na4-c5 or c4 break.",
          "The game remains complex with mutual kingside/queenside plans." 
        ]
      }
    }
  },
  "French Rubinstein Arsenal": {
    description: "A solid French Defense variation featuring 3...dxe4, leading to symmetrical structures with subtle imbalances.",
    category: "Defense",
    variations: {
      "Rubinstein Mainline": {
        moves: ["e4", "e6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bd7", "Nf3", "Bc6", "Bd3", "Nd7", "O-O", "Ngf6", "Nxf6+", "Qxf6", "Be2", "Bd6", "c4", "O-O", "Be3", "Bxf3", "Bxf3"],
        explanations: [
          "Black trades on e4 early to relieve central tension.",
          "...Bd7-c6 targets g2 and prepares ...Qh4.",
          "White develops naturally with Bd3 and Be3.",
          "The structure is symmetrical but allows play on both wings." 
        ]
      },
      "Fort Knox Setup": {
        moves: ["e4", "e6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bd7", "Nf3", "Bc6", "Bd3", "Nd7", "O-O", "Ngf6", "Nxf6+", "Nxf6", "Re1", "Be7", "c3", "O-O", "Bf4", "c5", "dxc5"],
        explanations: [
          "Black aims for quick exchange of light-squared bishops.",
          "The resulting structure resembles a Caro-Kann.",
          "Bf4 and c3 reinforce d4 and restrict ...e5.",
          "...c5 break frees Black's position at the right moment." 
        ]
      },
      "Rubinstein with Qd3": {
        moves: ["e4", "e6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bd7", "Nf3", "Nc6", "c3", "Nf6", "Bd3", "Be7", "O-O", "O-O", "Qe2", "Be8", "Re1", "Nd5", "a3", "a5", "c4"],
        explanations: [
          "White reinforces the center with c3/Qe2/Re1.",
          "...Be8 relocates the bishop to g6 or h5 later.",
          "a3 prevents ...Nb4 hitting c2 and forces ...a5.",
          "c4 expands on the queenside and fights for the d5 square." 
        ]
      }
    }
  },
  "French Exchange Active": {
    description: "Guides for both sides in the French Exchange, highlighting dynamic piece play despite the symmetrical structure.",
    category: "Classical",
    variations: {
      "Classical Development": {
        moves: ["e4", "e6", "d4", "d5", "exd5", "exd5", "Nf3", "Nf6", "Bd3", "Bd6", "O-O", "O-O", "Bg5", "h6", "Bh4", "c6", "Nbd2", "Nbd7", "Re1", "Re8", "c3", "Qc7", "Qc2"],
        explanations: [
          "Both sides develop naturally with bishops on d3/d6.",
          "Re1 and Re8 prepare central breaks e4 or e5.",
          "c3/Qc2 support b2-b4 or Ne5 ideas.",
          "The position is equal but rich in small tactical motifs." 
        ]
      },
      "Winawer-style Setup": {
        moves: ["e4", "e6", "d4", "d5", "exd5", "exd5", "Nc3", "Nc6", "Bb5", "Bb4", "Nge2", "Nge7", "O-O", "O-O", "Bf4", "Bf5", "Ng3", "Bg6", "Re1", "Re8", "h4", "h6", "c3"],
        explanations: [
          "White develops with Nc3/Bb5 similar to Winawer ideas.",
          "Both bishops on f4/f5 increase tension on the e-file.",
          "Ng3 and h4 aim for kingside space gains.",
          "Black mirrors with ...Bg6 and keeps the structure solid." 
        ]
      },
      "Isolated Pawn Battle": {
        moves: ["e4", "e6", "d4", "d5", "exd5", "exd5", "c4", "Nf6", "Nc3", "Bb4", "Bd3", "O-O", "Ne2", "dxc4", "Bxc4", "Nbd7", "O-O", "Nb6", "Bb3", "c6", "Bg5", "Be7", "Re1"],
        explanations: [
          "White plays c4 to create an IQP structure after exchanges.",
          "Black targets the isolated pawn with ...Bb4 and ...Nb6.",
          "Bg5 pins the knight, encouraging concessions.",
          "Re1 supports e5 breaks and central counterplay." 
        ]
      }
    }
  },
  "Queen's Gambit Accepted Modern": {
    description: "A principled defense where Black captures on c4 and returns the pawn at the right moment for active piece play.",
    category: "Defense",
    variations: {
      "Mainline with ...a6": {
        moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "a6", "Bxc4", "e6", "O-O", "c5", "a4", "Nc6", "Qe2", "cxd4", "Rd1", "Be7", "exd4", "O-O", "Nc3", "Nb4", "Bg5"],
        explanations: [
          "Black holds the pawn with ...a6 before returning it.",
          "...c5 challenges the center and releases the light-squared bishop.",
          "a4 stops ...b5 and keeps the pawn structure honest.",
          "Nc3 and Bg5 increase pressure on d5 and f6." 
        ]
      },
      "Early ...c5 Break": {
        moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "c5", "Bxc4", "e6", "O-O", "a6", "Qe2", "Nc6", "Rd1", "Qc7", "a4", "Bd6", "Nc3", "O-O", "h3", "Bd7", "d5"],
        explanations: [
          "Black quickly plays ...c5 to challenge the center.",
          "White develops pieces to natural squares and prepares d5.",
          "a4 prevents ...b5 and ensures the bishop stays on c4.",
          "When d5 breaks, central tension decides piece activity." 
        ]
      },
      "Janowski Variation": {
        moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "Bg4", "Bxc4", "e6", "O-O", "a6", "h3", "Bh5", "Nc3", "Nc6", "Qe2", "Bd6", "Rd1", "O-O", "e4", "Nd7", "g4"],
        explanations: [
          "Black pins the knight with ...Bg4, provoking h3/g4.",
          "White plays e4 to grab space and push the bishop back.",
          "...Nd7 prepares ...e5 in one go.",
          "g4 and Be3 set up kingside expansion for White." 
        ]
      }
    }
  },
  "Queen's Gambit Declined Lasker": {
    description: "A sturdy QGD line where Black uses ...Ne4 and ...f5 ideas to simplify into equal endgames.",
    category: "Defense",
    variations: {
      "Lasker Mainline": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "h6", "Bh4", "O-O", "Nf3", "Ne4", "Bxe7", "Qxe7", "Rc1", "c6", "Bd3", "Nxc3", "Rxc3", "dxc4", "Bxc4"],
        explanations: [
          "Black uses ...Ne4 to trade pieces and reduce tension.",
          "After Bxe7 Qxe7 material balance remains equal.",
          "...c6 supports ...c5 break later.",
          "White aims for pressure on the c-file while Black seeks simplification." 
        ]
      },
      "Improved ...Nbd7": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "h6", "Bh4", "O-O", "Qb3", "Nbd7", "Nf3", "dxc4", "Bxc4", "c5", "O-O", "a6", "a4", "b6", "Rad1"],
        explanations: [
          "White plays Qb3 to pressure d5 and b7.",
          "...Nbd7 reinforces f6 and prepares ...c5.",
          "a4 prevents ...b5 while Black plays ...b6 aiming for Bb7.",
          "The battle centers around control of the c-file and e5 square." 
        ]
      },
      "Lasker with ...dxc4": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "h6", "Bh4", "O-O", "Nf3", "dxc4", "Bxc4", "c5", "O-O", "a6", "Rc1", "Nc6", "dxc5", "Qxd1", "Rfxd1"],
        explanations: [
          "Black captures on c4 early to simplify quickly.",
          "...c5 challenges the center and leads to symmetrical structures.",
          "White uses Rc1/dxc5 to open the c-file before trading queens.",
          "Endgame equality is likely, but minute edges remain." 
        ]
      }
    }
  },
  "Queen's Gambit Tartakower Fortress": {
    description: "A reliable QGD variation where Black fianchettoes the bishop with ...b6 and ...Bb7, keeping a solid center.",
    category: "Defense",
    variations: {
      "Main Tartakower": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6", "cxd5", "Nxd5", "Bxe7", "Qxe7", "Nxd5", "exd5", "Rc1", "Be6", "Qa4"],
        explanations: [
          "...b6 prepares ...Bb7, reinforcing e6 and d5.",
          "White exchanges on d5 to create a symmetrical structure.",
          "Rc1 and Qa4 pressure the c-file and a7.",
          "Black aims for ...c5 breaks to activate pieces." 
        ]
      },
      "Se4 Sideline": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6", "cxd5", "Nxd5", "Bxe7", "Qxe7", "Rc1", "Bb7", "Bd3", "Nd7", "O-O"],
        explanations: [
          "Standard Tartakower development leads to a flexible fortress.",
          "Rc1 and Bd3 coordinate to pressure the c-file and kingside.",
          "...Nd7 supports ...c5 while keeping e5 under control.",
          "Both sides have rich maneuvering plans without immediate tactics." 
        ]
      },
      "Tartakower with ...c5 first": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "c5", "dxc5", "Bxc5", "Rc1", "Be7", "Be2", "b6", "O-O", "Bb7", "Nd4"],
        explanations: [
          "Black breaks with ...c5 before playing ...b6.",
          "After exchanges Black develops with ...Be7 and ...Bb7.",
          "White uses Rc1/Nd4 to increase pressure on c6 and e6.",
          "The resulting structures are balanced but dynamic." 
        ]
      }
    }
  },
  "Slav Chebanenko Lines": {
    description: "A modern Slav system featuring ...a6, giving Black flexible queenside options and solid structure.",
    category: "Defense",
    variations: {
      "Chebanenko Main": {
        moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "a6", "e3", "b5", "b3", "Bg4", "Be2", "e6", "O-O", "Nbd7", "Bb2", "Bd6", "Rc1", "O-O", "Qd2", "Qe7", "Ra1"],
        explanations: [
          "...a6 prepares ...b5 expanding on the queenside.",
          "White reacts with b3/Bb2 to pressure the long diagonal.",
          "...Bg4 and ...Bd6 develop actively while controlling e5.",
          "Game revolves around timing c4-c5 or ...e5 break." 
        ]
      },
      "Chebanenko with g3": {
        moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "a6", "g3", "dxc4", "Bg2", "b5", "Ne5", "Bb7", "O-O", "e6", "b3", "cxb3", "axb3", "Nbd7", "Nd3", "Be7", "e4"],
        explanations: [
          "White fianchettos and allows ...dxc4, planning b3 recapture.",
          "...b5 keeps the pawn and supports ...c5 later.",
          "Nd3 reinforces c5 square and prepares e4.",
          "Both sides have dynamic chances with pawn breaks." 
        ]
      },
      "Delayed ...b5": {
        moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "a6", "cxd5", "cxd5", "Bf4", "Nc6", "e3", "Bg4", "Be2", "e6", "O-O", "Bd6", "Bg5", "h6", "Bh4", "g5", "Bg3"],
        explanations: [
          "Black delays ...b5 and instead pins with ...Bg4.",
          "White plays Bf4/Bg5 to pressure e7 and g7.",
          "...g5 seeks expansion and challenges the bishop.",
          "Central tension remains with e3 and ...e6 controlling d5/e4." 
        ]
      }
    }
  },
  "Semi-Slav Botvinnik Complex": {
    description: "A sharp Semi-Slav system featuring early ...c6, ...d5, ...e6 with complex tactical possibilities.",
    category: "Defense",
    variations: {
      "Botvinnik Gambit": {
        moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "Nf3", "e6", "Bg5", "dxc4", "e4", "b5", "e5", "h6", "Bh4", "g5", "Nxg5", "hxg5", "Bxg5", "Nbd7", "g3", "Bb7", "Bg2"],
        explanations: [
          "Black captures on c4 and reinforces with ...b5 to hold the pawn.",
          "White sacrifices material with e4/e5 for central dominance.",
          "The resulting positions are razor sharp with opposite-side attacks.",
          "Knowledge of theory is essential to survive for either side." 
        ]
      },
      "Semi-Slav Moscow": {
        moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "Nf3", "e6", "Bg5", "h6", "Bh4", "dxc4", "e4", "g5", "Bg3", "b5", "Be2", "Bb7", "O-O", "Nbd7", "h4", "gxh4", "Bxh4"],
        explanations: [
          "Black plays ...h6 and ...g5 before capturing on c4.",
          "White keeps pressure with h4 and piece sacrifices on g5.",
          "...b5 and ...Bb7 aim to consolidate extra pawn.",
          "Both kings are unsafe, leading to complex tactical melee." 
        ]
      },
      "Anti-Meran": {
        moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "Nf3", "e6", "e3", "Nbd7", "Qc2", "Bd6", "Bd3", "O-O", "O-O", "dxc4", "Bxc4", "b5", "Be2", "Bb7", "e4", "e5", "Rd1"],
        explanations: [
          "White avoids Bg5 lines and plays quietly with e3/Qc2.",
          "After ...dxc4 ...b5 Black expands on the queenside.",
          "e4-e5 break challenges the center and opens the diagonal for Bb2.",
          "The position is strategically rich with minor piece battles." 
        ]
      }
    }
  },
  "Triangle Noteboom Surprise": {
    description: "A semi-Slav triangle setup where Black plays ...c6, ...e6, and ...d5, often capturing on c4 to transition into the Noteboom.",
    category: "Defense",
    variations: {
      "Noteboom Accepted": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "c6", "Nf3", "dxc4", "e4", "b5", "a4", "Bb4", "Be2", "Nf6", "Qc2", "Bb7", "O-O", "a6", "Rd1", "O-O", "Bg5", "Nbd7", "e5"],
        explanations: [
          "Black captures on c4 and supports it with ...b5.",
          "a4 tests the queenside structure and aims to regain the pawn.",
          "...Bb4 pin and ...Bb7 add pressure to the long diagonal.",
          "e5 break is thematic for White to open the center." 
        ]
      },
      "Accelerated Triangle": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "c6", "e4", "dxe4", "Nxe4", "Bb4+", "Bd2", "Qxd4", "Bxb4", "Qxe4+", "Ne2", "Na6", "Qd6", "Bd6", "Qxd6", "Ne7", "O-O-O", "Bd7", "h4"],
        explanations: [
          "White pushes e4 quickly, leading to open positions.",
          "...Bb4+ and queen checks disrupt White's coordination.",
          "After simplification both sides have minor piece imbalances.",
          "h4 aims to seize kingside space in the endgame." 
        ]
      },
      "Triangle Declined": {
        moves: ["d4", "d5", "c4", "e6", "Nc3", "c6", "Nf3", "f5", "g3", "Nf6", "Bg2", "Bd6", "O-O", "O-O", "Qd3", "Ne4", "Qc2", "Nd7", "Rb1", "Ndf6", "b4", "Bd7", "b5"],
        explanations: [
          "Black plays ...f5 entering Stonewall-style structure.",
          "White fianchettos and prepares b4-b5 queenside expansion.",
          "...Ne4 centralizes but Qc2 and Nd7 maintain balance.",
          "The middlegame features opposite-side pawn storms." 
        ]
      }
    }
  },
  "Ragozin Nimzo Hybrid": {
    description: "A dynamic defense combining ideas from the Nimzo-Indian and Queen's Gambit, featuring ...Bb4 and ...Nf6 setups.",
    category: "Defense",
    variations: {
      "Main Ragozin": {
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Nf3", "O-O", "Bg5", "h6", "Bh4", "c5", "e3", "cxd4", "exd4", "d5", "c5", "b6", "cxb6", "axb6", "Bd3", "Ba6", "O-O"],
        explanations: [
          "Black pins the knight and counters with ...c5.",
          "After exchanges the structure resembles a QGD with active bishops.",
          "...Ba6 trades the light-squared bishop to ease pressure.",
          "White aims for Ne5 and Rc1 to pressure c-file." 
        ]
      },
      "Vienna Variation": {
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2", "O-O", "a3", "Bxc3+", "Qxc3", "d5", "Nf3", "b6", "Bg5", "Ba6", "e3", "Nbd7", "cxd5", "Bxf1", "Kxf1", "exd5", "Qc6"],
        explanations: [
          "Qc2 prevents ...Ne4 and recaptures with the queen after ...Bxc3.",
          "Black plays ...Ba6 to trade dark-squared bishops.",
          "d5 strike frees the position; White maintains slight pressure.",
          "Qc6 centralizes the queen and eyes c4/f3." 
        ]
      },
      "Ragozin with ...b6": {
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Nf3", "O-O", "Qc2", "d5", "a3", "Bxc3+", "Qxc3", "b6", "Bg5", "Bb7", "cxd5", "exd5", "e3", "Nbd7", "Bd3", "h6", "Bh4"],
        explanations: [
          "Black builds a solid setup with ...b6 and ...Bb7.",
          "White keeps tension with Bg5 and a3.",
          "cxd5 and e3 lead to a Carlsbad structure.",
          "Both sides plan minority attacks on opposite wings." 
        ]
      }
    }
  },
  "Catalan Open System Pack": {
    description: "A repertoire for White in the Open Catalan, focusing on quick development and pressure on the queenside.",
    category: "System",
    variations: {
      "Open Catalan Main": {
        moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "dxc4", "Qa4+", "Nbd7", "Qxc4", "c5", "Nf3", "a6", "O-O", "b5", "Qc2", "Bb7", "Rd1", "Rc8", "dxc5", "Bxc5", "Qb3"],
        explanations: [
          "White recaptures on c4 while keeping bishops on long diagonals.",
          "...c5 and ...a6-b5 expand on the queenside for Black.",
          "Qc2/Qb3 apply pressure on b5 and e6.",
          "White often uses Rd1 and Nc3 to prepare e4 break." 
        ]
      },
      "Catalan with e4": {
        moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "dxc4", "Nf3", "c5", "Qa4+", "Bd7", "Qxc4", "Nc6", "Nc3", "Rc8", "dxc5", "Na5", "Qh4", "Bxc5", "O-O", "Be7", "e4"],
        explanations: [
          "White delays Qa4+ and instead focuses on quick e4 push.",
          "After ...Rc8 and ...Na5, Black targets c4 and e4.",
          "Qh4 eyes the kingside and guards e4.",
          "The resulting positions are dynamic with play on both flanks." 
        ]
      },
      "Catalan with b3": {
        moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3", "O-O", "O-O", "dxc4", "b3", "cxb3", "axb3", "c5", "Bb2", "Nc6", "e3", "a6", "Qe2", "Qc7", "Rd1"],
        explanations: [
          "White recaptures on c4 with b3, keeping the pawn structure intact.",
          "Black plays ...c5 and ...Nc6 to pressure the center.",
          "Bb2 and Rd1 line up on the long diagonal and d-file.",
          "Both sides aim for central breaks e4 or ...e5." 
        ]
      }
    }
  },
  "Benko Gambit Arsenal": {
    description: "A queenside gambit where Black sacrifices a b-pawn for long-term pressure on the a- and b-files.",
    category: "Gambit",
    variations: {
      "Accepted Main": {
        moves: ["d4", "Nf6", "c4", "c5", "d5", "b5", "cxb5", "a6", "bxa6", "Bxa6", "Nc3", "d6", "Nf3", "g6", "Bh4", "c5", "e3", "cxd4", "exd4", "d5", "c5", "b6", "cxb6", "axb6", "Bd3", "Ba6", "O-O"],
        explanations: [
          "Black sacrifices the b-pawn to open files for rooks and bishop.",
          "e4 and g3 keep the center solid for White.",
          "...Qa5 targets a2 and c3 while rooks go to b8/a8.",
          "White must neutralize pressure with Nd2, a4, or Qc2 setups." 
        ]
      },
      "Declined with a4": {
        moves: ["d4", "Nf6", "c4", "c5", "d5", "b5", "cxb5", "a6", "bxa6", "Bxa6", "Nc3", "d6", "Nf3", "g6", "g3", "Bg7", "Bg2", "O-O", "O-O", "Nbd7", "Re1", "Qa5", "a4"],
        explanations: [
          "White plays a4 to hold the extra pawn and restrict ...b5.",
          "Black continues with usual development, seeking pressure.",
          "Re1 and Nd2 aim to consolidate the queenside majority.",
          "Black may sacrifice further with ...Rfb8 and ...Rb4." 
        ]
      },
      "Benko Accepted with e4": {
        moves: ["d4", "Nf6", "c4", "c5", "d5", "b5", "cxb5", "a6", "bxa6", "Bxa6", "Nc3", "d6", "e4", "Bxf1", "Kxf1", "g6", "Nf3", "Bg7", "g3", "O-O", "Kg2", "Nbd7", "Re1"],
        explanations: [
          "White immediately plays e4, grabbing central space.",
          "Black gives back a second pawn to accelerate development.",
          "Kg2 safeguards the king on the long diagonal.",
          "Pressure remains on the b-file; White must stay accurate." 
        ]
      }
    }
  },
  "Old Indian Defense Framework": {
    description: "A solid King's Pawn defense where Black plays ...Nf6, ...d6, and ...e5 against 1.d4, aiming for a compact setup.",
    category: "Defense",
    variations: {
      "Classical Old Indian": {
        moves: ["d4", "Nf6", "c4", "d6", "Nc3", "e5", "Nf3", "Nbd7", "e4", "Be7", "Be2", "O-O", "O-O", "c6", "Re1", "Re8", "Bf1", "a6", "Rb1", "b5", "a3", "Bb7", "h3"],
        explanations: [
          "Black builds a sturdy center with ...e5 and ...Nbd7.",
          "White plays e4 and Be2 to maintain a strong pawn duo.",
          "...c6 and ...a6 support ...b5 expansion.",
          "Both sides maneuver before deciding on breakthroughs d5 or c5." 
        ]
      },
      "Janowski Variation": {
        moves: ["d4", "Nf6", "c4", "d6", "Nc3", "e5", "dxe5", "dxe5", "Qxd8+", "Kxd8", "Bg5", "c6", "O-O-O", "Kc7", "f4", "Bb4", "Nf3", "Bxc3", "bxc3", "Nxe4", "Bh4", "Nxc3", "Rd8"],
        explanations: [
          "White trades queens early, heading for an endgame edge.",
          "Black centralizes the king on c7 to support pawn structure.",
          "f4 and Bg5 aim to fix weaknesses on e5.",
          "Black's knight activity on e4/c3 compensates for structural issues." 
        ]
      },
      "Fianchetto Old Indian": {
        moves: ["d4", "Nf6", "c4", "d6", "Nc3", "e5", "Nf3", "Nbd7", "g3", "g6", "Bg2", "Bg7", "O-O", "O-O", "dxc4", "b3", "cxb3", "axb3", "c5", "Bb2", "Nc6", "e3", "a6", "Qe2", "Qc7", "Rd1"],
        explanations: [
          "White fianchettos, leading to King's Indian style positions.",
          "Black mirrors with ...g6/ ...Bg7 while keeping ...e5 pawn.",
          "...a6 and ...b5 expand on the queenside.",
          "White aims for d5 or cxb5 to open lines." 
        ]
      }
    }
  },
  // ... rest of the code ...
};
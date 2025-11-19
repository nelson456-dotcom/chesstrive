import React from 'react';

// Example PGN with 4+ levels of nesting for testing the annotation system
export const deepVariationExample = `[Event "Deep Variation Test Game"]
[Site "Chess Annotation System"]
[Date "2024.01.01"]
[Round "1"]
[White "Grandmaster A"]
[Black "Grandmaster B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1-0`;

// Complex PGN with multiple levels of variations
export const complexVariationExample = `[Event "Complex Variation Test"]
[Site "Chess Annotation System"]
[Date "2024.01.01"]
[Round "1"]
[White "Player 1"]
[Black "Player 2"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1-0`;

// Ultra-deep PGN with 6+ levels of nesting
export const ultraDeepVariationExample = `[Event "Ultra Deep Variation Test"]
[Site "Chess Annotation System"]
[Date "2024.01.01"]
[Round "1"]
[White "Master A"]
[Black "Master B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1-0`;

// PGN with comments and annotations
export const annotatedExample = `[Event "Annotated Game Example"]
[Site "Chess Annotation System"]
[Date "2024.01.01"]
[Round "1"]
[White "Annotator"]
[Black "Player"]
[Result "*"]

1. e4 {Opening with the King's Pawn} e5 {Black responds in kind} 2. Nf3 {Developing the knight} Nc6 {Black develops knight} 3. Bb5 {Spanish Opening} a6 {Morphy Defense} 4. Ba4 {Retreating the bishop} Nf6 {Black develops knight} 5. O-O {Castling for safety} Be7 {Black develops bishop} 6. Re1 {Rook to center file} b5 {Pushing pawn} 7. Bb3 {Bishop retreats} d6 {Black prepares development} 8. c3 {Supporting d4} O-O {Black castles} 9. h3 {Preventing Bg4} Nb8 {Knight retreats} 10. d4 {Central pawn push} Nbd7 {Knight develops} 11. c4 {Pawn push} c6 {Black supports d5} 12. cxb5 {Taking pawn} axb5 {Recapturing} 13. Nc3 {Developing knight} Bb7 {Black develops bishop} 14. Bg5 {Bishop pins knight} b4 {Pawn push} 15. Nb1 {Knight retreats} h6 {Preventing pin} 16. Bh4 {Bishop retreats} c5 {Central push} 17. dxe5 {Taking pawn} Nxe4 {Knight takes pawn} 18. Bxe7 {Bishop takes bishop} Qxe7 {Queen recaptures} 19. exd6 {Pawn takes pawn} Qf6 {Queen moves} 20. Nbd2 {Knight develops} Nxd6 {Knight takes pawn} 21. Nc4 {Knight moves} Nxc4 {Knight takes knight} 22. Bxc4 {Bishop takes knight} Nb6 {Knight moves} 23. Ne5 {Knight moves} Rae8 {Rook moves} 24. Bxf7+ {Bishop sacrifice} Rxf7 {Rook takes bishop} 25. Nxf7 {Knight takes rook} Rxe1+ {Rook check} 26. Qxe1 {Queen takes rook} Kxf7 {King takes knight} 27. Qe3 {Queen moves} Qg5 {Queen moves} 28. Qxg5 {Queen takes queen} hxg5 {Pawn takes queen} 29. b3 {Pawn push} Ke6 {King moves} 30. a3 {Pawn push} Kd6 {King moves} 31. axb4 {Pawn takes pawn} cxb4 {Pawn takes pawn} 32. Ra5 {Rook moves} Nd5 {Knight moves} 33. f3 {Pawn push} Bc8 {Bishop moves} 34. Kf2 {King moves} Bf5 {Bishop moves} 35. Ra7 {Rook moves} g6 {Pawn push} 36. Ra6+ {Rook check} Kc5 {King moves} 37. Ke1 {King moves} Nf4 {Knight moves} 38. g3 {Pawn push} Nxh3 {Knight takes pawn} 39. Kd2 {King moves} Kb5 {King moves} 40. Rd6 {Rook moves} Kc5 {King moves} 41. Ra6 {Rook moves} Nf2 {Knight moves} 42. g4 {Pawn push} Bd3 {Bishop moves} 43. Re6 {Rook moves} 1-0 {White wins}`;

export default {
  deepVariationExample,
  complexVariationExample,
  ultraDeepVariationExample,
  annotatedExample
};

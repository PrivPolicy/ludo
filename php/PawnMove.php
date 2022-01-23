<?php
include("./config.php");
include("./util.php");
session_start();

$offset = [
    "R" => [0, 39],
    "B" => [10, 9],
    "G" => [20, 19],
    "Y" => [30, 29]
];

$perimeterLength = 40;

if (isset($_SESSION["game_id"]) && isset($_SESSION["player_id"])) {
    $gameID = $_SESSION["game_id"];
    $playerID = $_SESSION["player_id"];

    if (isset($_SESSION["roll"])) {
        if (isset($_SESSION["canMove"]) == false) {
            echo (json_encode(["error" => "Cannot move yet"]));
            return;
        }

        $canMove = $_SESSION["canMove"];

        if ($canMove == false) {
            echo (json_encode(["error" => "You already moved this turn"]));
            return;
        }

        if (isset($_POST) && isset($_POST["id"])) {
            $link = mysqli_connect($hostname, $username, $password, $dbname);
            mysqli_query($link, "set names utf8");

            $query = "SELECT board_data, player_data FROM board WHERE board.game_id = '$gameID';";
            // $query = "SELECT board_data, player_data FROM board WHERE board.game_id = '$gameID';";
            $result = mysqli_query($link, $query);
            $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

            $b = json_decode($arr[0]["board_data"], true);
            $p = json_decode($arr[0]["player_data"], true);
            $color = $_SESSION["color"];
            $colorCapital = strtoupper($color[0]);
            $roll = $_SESSION["roll"];

            $pawnID = intval($_POST["id"]);
            $pawnPosition = $b["pawns"][$color][$pawnID];

            $pawnExploded = explode("-", $pawnPosition);
            $pawnArea = $pawnExploded[0];
            $pawnNum = intval($pawnExploded[1]);

            $newPawnPosition = "";

            //TODO zrobić kolizje

            if ($pawnArea == "P") { //perimeter
                $newPawnNum = $pawnNum + $roll;
                $offsetEnd = $offset[$colorCapital][1];
                if ($pawnNum  <= $offsetEnd && $newPawnNum  > $offsetEnd) { //kapujemy baze
                    $diff = $newPawnNum - $offsetEnd;

                    if ($diff > 4) {
                        echo (json_encode(["error" => "Invalid move (moved OOB)"]));
                        return;
                    } else {
                        $newPawnPosition = $colorCapital . "-" . $diff;

                        foreach ($b["pawns"] as $c => $v) {
                            if ($c == $color) {
                                for ($i = 0; $i < 4; $i++) {
                                    if ($v[$i] == $newPawnPosition) {
                                        echo (json_encode(["error" => "Invalid move (can't stack pawns in base 2)"]));
                                        return;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    $newPawnNum = $newPawnNum % $perimeterLength;

                    $newPawnPosition = "P-" . $newPawnNum;
                }
            } else if ($pawnArea[0] == "H") { //home
                if ($roll == 1 || $roll == 6) {
                    $newPawnPosition = "P-" . $offset[$pawnArea[1]][0];
                } else {
                    echo (json_encode(["error" => "Invalid move (roll 1 or 6 to move this pawn)"]));
                    return;
                }
            } else { //base
                $newPawnNum = $pawnNum + $roll;

                if ($newPawnNum  <= 4) {
                    $newPawnPosition = $colorCapital . "-" . $newPawnNum;

                    foreach ($b["pawns"][$color] as $pawn) {
                        if ($newPawnPosition == $pawn) {
                            echo (json_encode(["error" => "Invalid move (can't stack pawns in base)"]));
                            return;
                        }
                    }
                } else {
                    echo (json_encode(["error" => "Invalid move (moved OOB 2)"]));
                    return;
                }
            }

            foreach ($b["pawns"] as $c => $v) {
                for ($i = 0; $i < 4; $i++) {
                    if ($v[$i] == $newPawnPosition && $c != $color) {
                        $b["pawns"][$c][$i] = "H" . strtoupper($c[0]) . "-" . ($i + 1);
                    }
                }
            }

            $_SESSION["canMove"] = false;

            $b["pawns"][$color][$pawnID] = $newPawnPosition;

            //! Sprawdź, czy wygrana
            $pawnsInRightPlace = 0;
            $status = 1;

            foreach ($b["pawns"] as $c => $v) {
                for ($i = 0; $i < 4; $i++) {
                    if ($c == $color && $b["pawns"][$c][$i][0] == $colorCapital) {
                        $pawnsInRightPlace++;
                    }
                }
            }

            if ($pawnsInRightPlace == 4) {
                //! Wygrana

                $b["winner_color"] = $color;
                $b["winner_nick"] = $p[$playerID]["nick"];
                $b["state"] = 2;
                $b["ends"] = intval((microtime(true) + $gameEndDelay) * 1000);

                $status = 2;
            } else {
                //! Następna tura

                $index = array_search($b["turn"], $turnOrder);
                $p = json_decode($arr[0]["player_data"], true);
                $c = playerDataToColor($p);

                for ($i = $index + 1; $i < count($turnOrder) + $index; $i++) {
                    if (isset($c[$turnOrder[$i % count($turnOrder)]])) {
                        $b["turn"] = $turnOrder[$i % count($turnOrder)];
                        $b["turn_start"] = intval(microtime(true) * 1000);
                        $b["turn_end"] = intval((microtime(true) + $turnTime) * 1000);
                        $b["roll"] = -1;

                        break;
                    }
                }
            }

            $eb = json_encode($b);

            $query = "UPDATE board SET board_data = '$eb', state = $status WHERE board.game_id = '$gameID';";
            $result = mysqli_query($link, $query);

            echo ($eb);
        } else {
            echo (json_encode(["error" => "Select the pawn"]));
        }
    } else {
        echo (json_encode(["error" => "Roll the dice first"]));
    }
} else {
    echo (json_encode(["error" => "You need to join a game to perform this action!"]));
}

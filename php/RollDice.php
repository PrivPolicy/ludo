<?php
include("./config.php");
include("./util.php");
session_start();

if (isset($_SESSION["game_id"]) && isset($_SESSION["player_id"])) {
    $gameID = $_SESSION["game_id"];
    $playerID = $_SESSION["player_id"];

    $link = mysqli_connect($hostname, $username, $password, $dbname);
    mysqli_query($link, "set names utf8");

    $query = "SELECT board_data, player_data FROM board WHERE board.game_id = '$gameID';";
    $result = mysqli_query($link, $query);
    $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

    $b = json_decode($arr[0]["board_data"], true);
    $p = json_decode($arr[0]["player_data"], true);

    $color = $p[$playerID]["color"];

    if ($color == $b["turn"]) {
        if ($b["roll"] == -1) {
            $number = random_int(1, 6);

            //!check if move is valid

            $validMoves = 0;

            foreach ($b["pawns"][$color] as $position) {
                $a = CheckIfValidMove($position, $number, $color, $b["pawns"]);

                if ($a == true) {
                    $validMoves++;
                }
            }

            $b["roll"] = $number;

            if ($validMoves > 0) {
                $_SESSION["roll"] = $number;
                $_SESSION["canMove"] = true;
            } else { // skip tury
                $b["turn_end"] = intval((microtime(true) + $forceEndTurn) * 1000);
            }

            $eb = json_encode($b);

            $query = "UPDATE board SET board_data = '$eb' WHERE board.game_id = '$gameID';";
            $result = mysqli_query($link, $query);

            echo (json_encode(["roll" => $number, "color" => $_SESSION["color"]]));
        } else {
            echo (json_encode(["error" => "You already rolled the dice."]));
        }
    } else {
        echo (json_encode(["error" => "It's not your turn yet."]));
    }
} else {
    echo (json_encode(["error" => "You need to join a game to perform this action!"]));
}

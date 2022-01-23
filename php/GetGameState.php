<?php
include("./config.php");
include("./util.php");
session_start();

if (isset($_SESSION["game_id"]) && isset($_SESSION["player_id"])) {
    $gameID = $_SESSION["game_id"];
    $playerID = $_SESSION["player_id"];

    $link = mysqli_connect($hostname, $username, $password, $dbname);
    mysqli_query($link, "set names utf8");

    // usuwanie martwych pokoi
    $query = "DELETE FROM `board` WHERE (`timestamp` < CURRENT_TIMESTAMP() - INTERVAL 15 MINUTE AND `state` = 0) OR (`timestamp` < CURRENT_TIMESTAMP() - INTERVAL 5 MINUTE AND `state` != 0)";
    $result = mysqli_query($link, $query);

    $query = "SELECT board_data, player_data, state FROM board WHERE board.game_id = '$gameID';";
    $result = mysqli_query($link, $query);
    $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

    if (count($arr) == 0) { // gra nie istnieje
        session_destroy();
        echo (json_encode(["error" => "Game unavailable!"]));
        return;
    }

    $arr[0]["you"] = $playerID;

    $b = json_decode($arr[0]["board_data"], true);
    $p = json_decode($arr[0]["player_data"], true);
    $c = playerDataToColor($p);

    if ($b["starts"] < intval(microtime(true) * 1000) && $arr[0]["state"] == "0" && $b["starts"] != -1) {
        $query = "UPDATE board SET state = 1 WHERE board.game_id = '$gameID';";
        $result = mysqli_query($link, $query);

        $b["state"] = 1;

        foreach ($turnOrder as $color) {
            if (isset($c[$color])) {
                if ($_SESSION["color"] == $color) {

                    $b["turn"] = $color;
                    $b["turn_start"] = intval(microtime(true) * 1000);
                    $b["turn_end"] = intval((microtime(true) + $turnTime) * 1000);
                    $b["roll"] = -1;

                    $query = "UPDATE board SET board_data = '" . json_encode($b) . "' WHERE board.game_id = '$gameID';";
                    $result = mysqli_query($link, $query);
                }

                break;
            }
        }
    }

    if ($arr[0]["state"] == "2" && $b["ends"] < intval(microtime(true) * 1000)) {
        $color = $_SESSION["color"];

        session_destroy();

        $b["state"] = 3;
        $b["your_color"] = $color;
        $b["your_nick"] = $p[$playerID]["nick"];
        $arr[0]["board_data"] = json_encode($b);
        $arr[0]["state"] = 3;

        echo (json_encode($arr));
        return;
    }

    //manage turns

    if ($b["turn_end"] < (intval(microtime(true) * 1000))) { //next player
        $index = array_search($b["turn"], $turnOrder);

        for ($i = $index + 1; $i < count($turnOrder) + $index; $i++) {
            if (isset($c[$turnOrder[$i % count($turnOrder)]])) {
                // if ($_SESSION["color"] == $turnOrder[$i % count($turnOrder)]) {

                $b["turn"] = $turnOrder[$i % count($turnOrder)];
                $b["turn_start"] = intval(microtime(true) * 1000);
                $b["turn_end"] = intval((microtime(true) + $turnTime) * 1000);
                $b["roll"] = -1;

                $query = "UPDATE board SET board_data = '" . json_encode($b) . "' WHERE board.game_id = '$gameID';";
                $result = mysqli_query($link, $query);
                // }

                break;
            }
        }
    }

    $arr[0]["board_data"] = json_encode($b);
    $arr[0]["player_data"] = json_encode($p);

    echo (json_encode($arr));
} else {
    echo (json_encode(["error" => "You need to join a game to perform this action!", "action" => "restart"]));
}

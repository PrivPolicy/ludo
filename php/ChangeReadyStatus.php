<?php
include("./config.php");
include("./util.php");
session_start();

if (isset($_SESSION["game_id"])) {
    //mamy sesję panowie

    $link = mysqli_connect($hostname, $username, $password, $dbname);

    mysqli_query($link, "set names utf8");

    $query = 'SELECT player_data, board_data, state FROM board WHERE board.game_id = "' . $_SESSION["game_id"] . '";';
    $result = mysqli_query($link, $query);
    $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

    if ($arr[0]["state"] != 0) {
        echo (json_encode(["error" => "You can't do that!"]));
        return;
    }

    if (isset($arr[0]["player_data"])) {
        $o = json_decode($arr[0]["player_data"], true);
        $pid = $_SESSION["player_id"];

        if ($o[$pid]["status"] == 0) {
            $o[$pid]["status"] = 1;
        } else if ($o[$pid]["status"] == 1) {
            $o[$pid]["status"] = 0;
        }

        $total = getTotalPlayers($o);
        $ready = getReadyPlayers($o);

        $b = json_decode($arr[0]["board_data"], true);

        if (($time = $timetable[$ready][$total]) != null) {
            $b["starts"] = (microtime(true) + $time) * 1000;
        } else {
            $b["starts"] = -1;
        }

        $e = json_encode($o);
        $b = json_encode($b);

        $query = 'UPDATE board SET player_data = ?, board_data = ? WHERE board.game_id = ?;';
        $stmt = mysqli_prepare($link, $query);
        mysqli_stmt_bind_param($stmt, "sss", $e, $b, $_SESSION["game_id"]);
        mysqli_stmt_execute($stmt);

        echo (json_encode(["status" => $o[$pid]["status"]]));
    } else {
        echo (json_encode(["error" => "Game not found."]));
    }
} else {
    echo (json_encode(["session" => "notFound"]));
}

//session_destroy();

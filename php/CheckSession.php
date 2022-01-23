<?php
include("./config.php");
include("./util.php");
session_start();

if (isset($_SESSION["game_id"])) {
    //mamy sesję panowie

    //check if room exists
    $link = mysqli_connect($hostname, $username, $password, $dbname);

    mysqli_query($link, "set names utf8");

    $query = 'SELECT COUNT(board.game_id) AS game_id FROM board WHERE board.game_id = "' . $_SESSION["game_id"] . '";';
    $result = mysqli_query($link, $query);
    $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

    if ($arr[0]["game_id"] == "0") {
        echo (json_encode(["error" => "Previous game is not available."]));
        session_destroy();
    } else {
        echo (json_encode(["session" => "loaded"]));
    }
} else {
    echo (json_encode(["session" => "notFound"]));
}

//session_destroy();

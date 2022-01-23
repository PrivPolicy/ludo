<?php
$timetable = [ // vertical - total players; horizontal - ready players
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null,  10,   30,   60],
    [null, null, null,  10,   30],
    [null, null, null, null,  10],
];

$turnOrder = ["red", "blue", "green", "yellow"];

$turnTime = 20;
$forceEndTurn = 5;
$gameEndDelay = 3;

function randomString($len = 32) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $len; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function emptyUserData($nick, $color) {
    $data = (array)[
        "nick" => $nick,
        "joined" => intval(microtime(true) * 1000),
        "status" => 0,
        "color" => $color
    ];

    return $data;
}

function emptyBoardData() {
    $data = (array)[
        "starts" => -1,
        "turn" => null,
        "turn_start" => -1,
        "turn_end" => -1,
        "pawns" => (array)[
            "red" => [null, null, null, null],
            "blue" => [null, null, null, null],
            "green" => [null, null, null, null],
            "yellow" => [null, null, null, null]
        ],
        "roll" => -1,
        "winner_color" => null,
        "winner_nick" => null,
        "ends" => -1,
    ];

    return $data;
}

function getTotalPlayers($playerData) {
    return count($playerData);
}

function getReadyPlayers($playerData) {
    $count = 0;

    for ($i = 0; $i < count($playerData); $i++) {
        if ($playerData[array_keys($playerData)[$i]]["status"] == 1) {
            $count++;
        }
    }

    return $count;
}

function playerDataToColor($playerData) {
    $o = [];

    foreach ($playerData as $k => $v) {
        $o[$v["color"]] = $k;
    }

    return $o;
}

function CheckIfValidMove($position, $roll, $color, $pawns) {
    $offset = (array)[
        "R" => [0, 39],
        "B" => [10, 9],
        "G" => [20, 19],
        "Y" => [30, 29]
    ];

    $pawnArea = explode("-", $position)[0];
    $pawnNumber = intval(explode("-", $position)[1]);

    $colorCapital = strtoupper($color[0]);

    $newPawnPosition = "";

    if ($pawnArea[0] == "H") {
        return ($roll == 1 || $roll == 6);
    } else if ($pawnArea[0] == "P") {
        $newPawnNumber = $pawnNumber + $roll;
        $offsetEnd = $offset[$colorCapital][1];

        if ($pawnNumber <= $offsetEnd && $newPawnNumber > $offsetEnd) { //kapujemy baze
            $diff = $newPawnNumber - $offsetEnd;

            if ($diff > 4) {
                return false;
            } else {
                $newPawnPosition = "$colorCapital-$diff";

                foreach ($pawns as $c => $v) {
                    if ($c == $color) {
                        for ($i = 0; $i < 4; $i++) {
                            if ($v[$i] == $newPawnPosition) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }
        } else {
            return true;
        }
    } else {
        if ($pawnNumber + $roll > 4) {
            return false;
        }

        $newPawnPosition = "$colorCapital-" . strval($pawnNumber + $roll);

        foreach ($pawns as $c => $v) {
            if ($c == $color) {
                for ($i = 0; $i < 4; $i++) {
                    if ($v[$i] == $newPawnPosition) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
}

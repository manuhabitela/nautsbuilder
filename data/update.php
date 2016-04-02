<?php
if (!empty($_POST)) {
	$sheet = !empty($_POST['sheet']) ? $_POST['sheet'] : '';
	if (empty($sheet)) {
		return false;
	}

	$characters = !empty($_POST['characters']) ? $_POST['characters'] : '';
	$skills = !empty($_POST['skills']) ? $_POST['skills'] : '';
	$upgrades = !empty($_POST['upgrades']) ? $_POST['upgrades'] : '';
	$scaling = !empty($_POST['scaling']) ? $_POST['scaling'] : '';
	$data = array('characters' => $characters, 'skills' => $skills, 'upgrades' => $upgrades, 'scaling' => $scaling);

	$errors = 0;

	$lastUpdate = "window.leiminauts = window.leiminauts || {};\n
leiminauts.lastServerDataUpdate = " . time()*1000 . "; //" . date('Y-m-d H:i:s');

	$log = "";
	foreach ($data as $type => $json) {
		$testJson = json_decode($json);
		$log .= "[" . date('Y-m-d H:i:s') . "]: " . $sheet . " " . $type;

		if (trim($json) === "") {
			// json_decode accepts an empty string which is not valid JSON.
			// In order to avoid this, we store an empty list.
			file_put_contents(dirname(__FILE__).'/'.$sheet.'-'.$type.'.json', '[]');
			$log .= " warning: data '".$json."' was empty!";
		} else if (json_last_error() == JSON_ERROR_NONE) {
			file_put_contents(dirname(__FILE__).'/'.$sheet.'-'.$type.'.json', $json);
			$log .= " ok";
			if ($type === 'scaling') {
				$log .= ": ".print_r($json, true);
			} else {
				$log .= "!";
			}
		} else {
			$errors++;
			$log .= " error '" . json_last_error() . "':\n";
			$log .= print_r($json, true);
		}
		$log .= "\n";
	}

	if ($errors === 0 || $errors !== count($data)) {
		file_put_contents(dirname(__FILE__).'/last-update.js', $lastUpdate);
	}

	file_put_contents(dirname(__FILE__).'/last-update.log', $log, FILE_APPEND);
	echo $log;
}
?>

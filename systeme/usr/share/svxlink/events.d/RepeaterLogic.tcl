namespace eval RepeaterLogic {

if {$logic_name != [namespace tail [namespace current]]} {
  return;
}

variable repeater_is_up 0;

proc startup {} {
  global logic_name;
  append func $logic_name "::checkPeriodicIdentify";
  Logic::addMinuteTickSubscriber $func;
  Logic::startup;
}

proc no_such_module {module_id} {
  Logic::no_such_module $module_id;
}

proc manual_identification {} {
  Logic::manual_identification;
}

proc send_rgr_sound {} {
  Logic::send_rgr_sound;
}

proc macro_empty {} {
  Logic::macro_empty;
}

proc macro_not_found {} {
  Logic::macro_not_found;
}

proc macro_syntax_error {} {
  Logic::macro_syntax_error;
}

proc macro_module_not_found {} {
  Logic::macro_module_not_found;
}

proc macro_module_activation_failed {} {
  Logic::macro_module_activation_failed;
}

proc macro_another_active_module {} {
  Logic::macro_another_active_module;
}

proc unknown_command {cmd} {
  Logic::unknown_command $cmd;
}

proc command_failed {cmd} {
  Logic::command_failed $cmd;
}

proc activating_link {name} {
  Logic::activating_link $name;
}

proc deactivating_link {name} {
  Logic::deactivating_link $name;
}

proc link_not_active {name} {
  Logic::link_not_active $name;
}

proc link_already_active {name} {
  Logic::link_already_active $name;
}

proc transmit {is_on} {
  Logic::transmit $is_on;
}

proc squelch_open {rx_id is_open} {
  Logic::squelch_open $rx_id $is_open;
}

proc every_minute {} {
  Logic::every_minute;
}

proc every_second {} {
  Logic::every_second;
}

proc repeater_up {reason} {
  global mycall;
  global active_module;
  variable repeater_is_up;

  set repeater_is_up 1;

  if {($reason != "SQL_OPEN") && ($reason != "CTCSS_OPEN") &&
      ($reason != "SQL_RPT_REOPEN")} {
    set now [clock seconds];
    if {$now-$Logic::prev_ident < $Logic::min_time_between_ident} {
      return;
    }
    set Logic::prev_ident $now;

    spellWord $mycall;
    playMsg "Core" "repeater";
    playSilence 250;

    if {$active_module != ""} {
      playMsg "Core" "active_module";
      playMsg $active_module "name";
    }
  }
}

proc repeater_down {reason} {
  global mycall;
  variable repeater_is_up;

  set repeater_is_up 0;

  if {$reason == "SQL_FLAP_SUP"} {
    playSilence 500;
    playMsg "Core" "interference";
    playSilence 500;
    return;
  }

  set now [clock seconds];
  if {$now-$Logic::prev_ident < $Logic::min_time_between_ident} {
    playTone 400 900 50
    playSilence 100
    playTone 360 900 50
    playSilence 500
    return;
  }
  set Logic::prev_ident $now;

  spellWord $mycall;
  playMsg "Core" "repeater";
  playSilence 250;

}

proc repeater_idle {} {
  set iterations 8;
  set base 2;
  set max [expr {pow($base, $iterations)}];
  for {set i $iterations} {$i>0} {set i [expr $i - 1]} {
    playTone 1100 [expr {round(pow($base, $i) * 150 / $max)}] 100;
    playTone 1200 [expr {round(pow($base, $i) * 150 / $max)}] 100;
  }
}

proc checkPeriodicIdentify {} {
  variable repeater_is_up;
    Logic::checkPeriodicIdentify;
}

proc dtmf_digit_received {digit duration} {
  return [Logic::dtmf_digit_received $digit $duration];
}

proc dtmf_cmd_received {cmd} {
  return [Logic::dtmf_cmd_received $cmd];
}

proc activating_qso_recorder {} {
  Logic::activating_qso_recorder;
}

proc deactivating_qso_recorder {} {
  Logic::deactivating_qso_recorder;
}

proc qso_recorder_not_active {} {
  Logic::qso_recorder_not_active;
}

proc qso_recorder_already_active {} {
  Logic::qso_recorder_already_active;
}

proc qso_recorder_timeout_activate {} {
  Logic::qso_recorder_timeout_activate
}

proc qso_recorder_timeout_deactivate {} {
  Logic::qso_recorder_timeout_deactivate
}

proc identify_nag {} {
  playSilence 500;
  playMsg "Core" "please_identify";
  playSilence 500;
}

proc set_language {lang_code} {
  Logic::set_language "$lang_code";
}

proc list_languages {} {
  Logic::list_languages
}

proc logic_online {online} {
  Logic::logic_online $online
}

}
namespace eval Logic {

variable prev_ident 0;

variable min_time_between_ident 120;

variable short_ident_interval 0;
variable long_ident_interval 0;

variable short_voice_id_enable  1
variable short_cw_id_enable     0
variable short_announce_enable  0
variable short_announce_file    ""

variable long_voice_id_enable   1
variable long_cw_id_enable      0
variable long_announce_enable   0
variable long_announce_file     ""

variable ident_only_after_tx 0;
variable need_ident 0;

variable minute_tick_subscribers [list];
variable second_tick_subscribers [list];

variable sql_rx_id "?";

proc startup {} {
}

proc no_such_module {module_id} {
  playMsg "Core" "no_such_module";
  playNumber $module_id;
}

proc manual_identification {} {
  global mycall;
  global report_ctcss;
  global active_module;
  global loaded_modules;
  variable CFG_TYPE;
  variable prev_ident;

  set epoch [clock seconds];
  set hour [clock format $epoch -format "%k"];
  regexp {([1-5]?\d)$} [clock format $epoch -format "%M"] -> minute;
  set prev_ident $epoch;

  playMsg "Core" "online";
  spellWord $mycall;
  if {$CFG_TYPE == "Repeater"} {
    playMsg "Core" "repeater";
  }
  playSilence 250;
  playMsg "Core" "the_time_is";
  playTime $hour $minute;
  playSilence 250;
  if {$report_ctcss > 0} {
    playMsg "Core" "pl_is";
    playFrequency $report_ctcss
    playSilence 300;
  }
  if {$active_module != ""} {
    playMsg "Core" "active_module";
    playMsg $active_module "name";
    playSilence 250;
    set func "::";
    append func $active_module "::status_report";
    if {"[info procs $func]" ne ""} {
      $func;
    }
  } else {
    foreach module [split $loaded_modules " "] {
      set func "::";
      append func $module "::status_report";
      if {"[info procs $func]" ne ""} {
	$func;
      }
    }
  }
  playMsg "Default" "press_0_for_help"
  playSilence 250;
}

proc send_short_ident {{hour -1} {minute -1}} {
  global mycall;
  variable CFG_TYPE;
  variable short_announce_file
  variable short_announce_enable
  variable short_voice_id_enable
  variable short_cw_id_enable

  if {$short_voice_id_enable} {
    puts "Playing short voice ID"
    spellWord $mycall;
    if {$CFG_TYPE == "Repeater"} {
      playMsg "Core" "repeater";
    }
    playSilence 500;
  }

  if {$short_announce_enable} {
    puts "Playing short announce"
    if [file exist "$short_announce_file"] {
      playFile "$short_announce_file"
      playSilence 500
    }
  }

  if {$short_cw_id_enable} {
    puts "Playing short CW ID"
    if {$CFG_TYPE == "Repeater"} {
      set call "$mycall/R"
      CW::play $call
    } else {
      CW::play $mycall
    }
    playSilence 500;
  }
}

proc send_long_ident {hour minute} {
  global mycall;
  global loaded_modules;
  global active_module;
  variable CFG_TYPE;
  variable long_announce_file
  variable long_announce_enable
  variable long_voice_id_enable
  variable long_cw_id_enable

  if {$long_voice_id_enable} {
    puts "Playing Long voice ID"
    spellWord $mycall;
    if {$CFG_TYPE == "Repeater"} {
      playMsg "Core" "repeater";
    }
    playSilence 500;
    playMsg "Core" "the_time_is";
    playSilence 100;
    playTime $hour $minute;
    playSilence 500;

    if {$active_module == ""} {
      foreach module [split $loaded_modules " "] {
        set func "::";
        append func $module "::status_report";
        if {"[info procs $func]" ne ""} {
          $func;
        }
      }
    }

    playSilence 500;
  }

  if {$long_announce_enable} {
    puts "Playing long announce"
    if [file exist "$long_announce_file"] {
      playFile "$long_announce_file"
      playSilence 500
    }
  }

  if {$long_cw_id_enable} {
    puts "Playing long CW ID"
    if {$CFG_TYPE == "Repeater"} {
      set call "$mycall/R"
      CW::play $call
    } else {
      CW::play $mycall
    }
    playSilence 100
  }
}

proc send_rgr_sound {} {
  variable sql_rx_id

  if {$sql_rx_id != "?"} {
    # 150 CPM, 1000 Hz, -4 dBFS
    CW::play $sql_rx_id 150 1000 -4
    set sql_rx_id "?"
  } else {
    playTone 440 500 100
  }
  playSilence 100
}

proc macro_empty {} {
  playMsg "Core" "operation_failed";
}

proc macro_not_found {} {
  playMsg "Core" "operation_failed";
}

proc macro_syntax_error {} {
  playMsg "Core" "operation_failed";
}

proc macro_module_not_found {} {
  playMsg "Core" "operation_failed";
}

proc macro_module_activation_failed {} {
  playMsg "Core" "operation_failed";
}

proc macro_another_active_module {} {
  global active_module;

  playMsg "Core" "operation_failed";
  playMsg "Core" "active_module";
  playMsg $active_module "name";
}

proc unknown_command {cmd} {
  spellWord $cmd;
  playMsg "Core" "unknown_command";
}

proc command_failed {cmd} {
  spellWord $cmd;
  playMsg "Core" "operation_failed";
}

proc activating_link {name} {
  if {[string length $name] > 0} {
    playMsg "Core" "activating_link_to";
    spellWord $name;
  }
}

proc deactivating_link {name} {
  if {[string length $name] > 0} {
    playMsg "Core" "deactivating_link_to";
    spellWord $name;
  }
}

proc link_not_active {name} {
  if {[string length $name] > 0} {
    playMsg "Core" "link_not_active_to";
    spellWord $name;
  }
}

proc link_already_active {name} {
  if {[string length $name] > 0} {
    playMsg "Core" "link_already_active_to";
    spellWord $name;
  }
}

proc transmit {is_on} {
  variable prev_ident;
  variable need_ident;
  if {$is_on && ([clock seconds] - $prev_ident > 5)} {
    set need_ident 1;
  }
}

proc squelch_open {rx_id is_open} {
  variable sql_rx_id;
  set sql_rx_id $rx_id;
}

proc dtmf_digit_received {digit duration} {
  return 0;
}

proc dtmf_cmd_received {cmd} {

  return 0
}

proc every_minute {} {
  variable minute_tick_subscribers;
  foreach subscriber $minute_tick_subscribers {
    $subscriber;
  }
}

proc every_second {} {
  variable second_tick_subscribers;
  foreach subscriber $second_tick_subscribers {
    $subscriber;
  }
}

proc addTimerTickSubscriber {func} {
  puts "*** WARNING: Calling deprecated TCL event handler addTimerTickSubcriber."
  puts "             Use addMinuteTickSubscriber instead"
  addMinuteTickSubscriber $func;
}

proc addMinuteTickSubscriber {func} {
  variable minute_tick_subscribers;
  lappend minute_tick_subscribers $func;
}

proc addSecondTickSubscriber {func} {
  variable second_tick_subscribers;
  lappend second_tick_subscribers $func;
}

proc checkPeriodicIdentify {} {
  variable prev_ident;
  variable short_ident_interval;
  variable long_ident_interval;
  variable min_time_between_ident;
  variable ident_only_after_tx;
  variable need_ident;
  global logic_name;

  if {$short_ident_interval == 0} {
    return;
  }

  set now [clock seconds];
  set hour [clock format $now -format "%k"];
  regexp {([1-5]?\d)$} [clock format $now -format "%M"] -> minute;

  set short_ident_now \
      	    [expr {($hour * 60 + $minute) % $short_ident_interval == 0}];
  set long_ident_now 0;
  if {$long_ident_interval != 0} {
    set long_ident_now \
      	    [expr {($hour * 60 + $minute) % $long_ident_interval == 0}];
  }

  if {$long_ident_now} {
    puts "$logic_name: Sending long identification...";
    send_long_ident $hour $minute;
    set prev_ident $now;
    set need_ident 0;
  } else {
    if {$now - $prev_ident < $min_time_between_ident} {
      return;
    }
    if {$ident_only_after_tx && !$need_ident} {
      return;
    }

    if {$short_ident_now} {
      puts "$logic_name: Sending short identification...";
      send_short_ident $hour $minute;
      set prev_ident $now;
      set need_ident 0;
    }
  }
}

proc activating_qso_recorder {} {
  playMsg "Core" "activating";
  playMsg "Core" "qso_recorder";
}

proc deactivating_qso_recorder {} {
  playMsg "Core" "deactivating";
  playMsg "Core" "qso_recorder";
}

proc qso_recorder_not_active {} {
  playMsg "Core" "qso_recorder";
  playMsg "Core" "not_active";
}

proc qso_recorder_already_active {} {
  playMsg "Core" "qso_recorder";
  playMsg "Core" "already_active";
}

proc qso_recorder_timeout_activate {} {
  playMsg "Core" "timeout"
  playMsg "Core" "activating";
  playMsg "Core" "qso_recorder";
}

proc qso_recorder_timeout_deactivate {} {
  playMsg "Core" "timeout"
  playMsg "Core" "deactivating";
  playMsg "Core" "qso_recorder";
}

proc set_language {lang_code} {
  global logic_name;
  puts "$logic_name: Setting language $lang_code (NOT IMPLEMENTED)";

}

proc list_languages {} {
  global logic_name;
  puts "$logic_name: Available languages: (NOT IMPLEMENTED)";

}

proc logic_online {online} {
  global mycall
  variable CFG_TYPE

  if {$online} {
    playMsg "Core" "online";
    spellWord $mycall;
    if {$CFG_TYPE == "Repeater"} {
      playMsg "Core" "repeater";
    }
  }
}

if [info exists CFG_SHORT_IDENT_INTERVAL] {
  if {$CFG_SHORT_IDENT_INTERVAL > 0} {
    set short_ident_interval $CFG_SHORT_IDENT_INTERVAL;
  }
}

if [info exists CFG_LONG_IDENT_INTERVAL] {
  if {$CFG_LONG_IDENT_INTERVAL > 0} {
    set long_ident_interval $CFG_LONG_IDENT_INTERVAL;
    if {$short_ident_interval == 0} {
      set short_ident_interval $long_ident_interval;
    }
  }
}

if [info exists CFG_IDENT_ONLY_AFTER_TX] {
  if {$CFG_IDENT_ONLY_AFTER_TX > 0} {
    set ident_only_after_tx $CFG_IDENT_ONLY_AFTER_TX;
  }
}

if [info exists CFG_SHORT_ANNOUNCE_ENABLE] {
  set short_announce_enable $CFG_SHORT_ANNOUNCE_ENABLE
}

if [info exists CFG_SHORT_ANNOUNCE_FILE] {
  set short_announce_file $CFG_SHORT_ANNOUNCE_FILE
}

if [info exists CFG_SHORT_VOICE_ID_ENABLE] {
  set short_voice_id_enable $CFG_SHORT_VOICE_ID_ENABLE
}

if [info exists CFG_SHORT_CW_ID_ENABLE] {
  set short_cw_id_enable $CFG_SHORT_CW_ID_ENABLE
}

if [info exists CFG_LONG_ANNOUNCE_ENABLE] {
  set long_announce_enable $CFG_LONG_ANNOUNCE_ENABLE
}

if [info exists CFG_LONG_ANNOUNCE_FILE] {
  set long_announce_file $CFG_LONG_ANNOUNCE_FILE
}

if [info exists CFG_LONG_VOICE_ID_ENABLE] {
  set long_voice_id_enable $CFG_LONG_VOICE_ID_ENABLE
}

if [info exists CFG_LONG_CW_ID_ENABLE] {
  set long_cw_id_enable $CFG_LONG_CW_ID_ENABLE
}

}
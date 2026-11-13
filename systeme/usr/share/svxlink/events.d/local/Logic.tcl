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

variable yopIntervalle 6;

proc startup {} {

	variable room;

	set fp [open "/etc/weblink/network" "r"];
	set room [string tolower [gets $fp]]

	puts "**** Salon: $room ****";
}

proc hotspotNonConfigure {} {
  variable room;
  if {![info exists room]} { return 0 }
  if {[catch {open "/etc/weblink/svxlink.$room" "r"} fp]} { return 0 }
  set data [read $fp]
  close $fp
  return [regexp -line {^CALLSIGN=\([0-9]+\) YOP[0-9]* } $data]
}

proc identRadioAmateur {} {
  variable CFG_IDENT_RADIOAMATEUR
  return [expr {[info exists CFG_IDENT_RADIOAMATEUR] && $CFG_IDENT_RADIOAMATEUR == 1}]
}

proc yopAnnonce {} {
  variable yopIntervalle;
  variable short_ident_interval;

  if {$yopIntervalle == 0} { return }

  set now [clock seconds];
  set hour [clock format $now -format "%k"];
  regexp {([1-5]?\d)$} [clock format $now -format "%M"] -> minute;
  set total [expr {$hour * 60 + $minute}];

  if {$total % $yopIntervalle != 0} { return }
  if {$short_ident_interval > 0 && $total % $short_ident_interval == 0} { return }
  if {![hotspotNonConfigure]} { return }

  puts "Hotspot non configuré, annonce seule"
  playSilence 250
  playMsg "Core" "nonConfigure"
  playSilence 500
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
  #global report_ctcss;
  variable CFG_TYPE;
  variable short_announce_file
  variable short_announce_enable
  variable short_voice_id_enable
  variable short_cw_id_enable

  #if {$short_voice_id_enable} {
  #  puts "Playing short voice ID"
  #  spellWord $mycall;
  #  if {$CFG_TYPE == "Repeater"} {
  #    playMsg "Core" "repeater";
  #  }
  #  playSilence 500;
  #  if {$report_ctcss > 0} {
  #    playMsg "Core" "pl_is";
  #    playFrequency $report_ctcss
  #    playSilence 300;
  #  }
  #}

  if {[identRadioAmateur]} {
    spellWord $mycall;
  } else {
    CW::play " I"  104 680 -6
  }
    playSilence 488;

    playMsg "Core" "the_time_is";
    playSilence 100;
    playTime $hour $minute;
    playSilence 500;

  if {[hotspotNonConfigure]} {
    puts "Hotspot non configuré, annonce"
    playMsg "Core" "nonConfigure"
    playSilence 500
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
  global report_ctcss;
  variable CFG_TYPE;
  variable long_announce_file
  variable long_announce_enable
  variable long_voice_id_enable
  variable long_cw_id_enable

  CW::play " I"  104 680 -6
  playSilence 488;

  if {$long_voice_id_enable} {
    puts "Playing Long voice ID"
    spellWord $mycall;
    if {$CFG_TYPE == "Repeater"} {
      playMsg "Core" "repeater";
    }
    playSilence 500;

  if {$report_ctcss > 0} {
    playMsg "Core" "pl_is";
    playFrequency $report_ctcss
    playSilence 300;
  }

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
    CW::play $sql_rx_id 150 1000 -4
    set sql_rx_id "?"
  } else {
    CW::play " I"  104 680 -6
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

  proc sayIP {} {
    set result [exec /etc/weblink/getIP]
    puts "$result"

    regexp "(\[0-9]{1,3})\.(\[0-9]{1,3})\.(\[0-9]{1,3})\.(\[0-9]{1,3})" $result all first second third fourth

    playSilence 180
    playMsg "Core" "ip"
    playSilence 180
    playNumber $first
    playSilence 120
    playMsg "default" "dash"
    playSilence 120
    playNumber $second
    playSilence 120
    playMsg "default" "dash"
    playSilence 120
    playNumber $third
    playSilence 120
    playMsg "default" "dash"
    playSilence 120
    playNumber $fourth
    playSilence 500;
  }

  proc sayInternetStatus {} {
    if {[catch {exec ping -c 1 google.com} result] == 0} {
      puts "Wouanegaine !!"
      playSilence 148
      playMsg "Core" "ok"
    } else {
      puts "Ya une couille dans le potage !!"
      playSilence 100
      playMsg "Core" "pasok"
    }
  }

# 88 Arret Hotspot
  if {$cmd == "88"} {
    puts " Son 'off' et arret differé"
    playSilence 298 ;
    playMsg "Core" "off"
    playSilence 2288 ;

    exec sh -c {killall clignotage.sh 2>/dev/null} &
    exec nohup /bin/bash -c "sleep 3 && shutdown -h now" &
    return 1
  }

# 90 Annonce longue
  if {$cmd == "90"} {
    puts "Annonce longue"
    set epoch [clock seconds];
    set hour [clock format $epoch -format "%k"];
    regexp {([1-5]?\d)$} [clock format $epoch -format "%M"] -> minute;
    send_long_ident $hour $minute;
    return 1
  }

# 91 Heure
  if {$cmd == "91"} {
    puts "Annonce heure"
    set epoch [clock seconds];
    set hour [clock format $epoch -format "%k"];
    regexp {([1-5]?\d)$} [clock format $epoch -format "%M"] -> minute;
    playSilence 148
    playMsg "Core" "the_time_is";
    playTime $hour $minute;
    return 1
  }

# 92 Température Hotspot
  if {$cmd == "92"} {
    puts "Annonce température"
    set temp_raw [exec cat /sys/class/thermal/thermal_zone0/temp]
    set temp_c [expr {round($temp_raw / 1000)}]
    playSilence 148
    playMsg "Core" "temperature";
    playNumber $temp_c;
    playMsg "Core" "degres";
    return 1
  }

# 93 Ip
  if {$cmd == "93"} {
    sayIP
    return 1
  }

# 94 Statut Internet
  if {$cmd == "94"} {
    puts "Vérification Internet .."
    sayInternetStatus
    return 1
  }

# 95 Perroquet
  if {$cmd == "95"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.default &
    return 1
  }

# 33 Pmr446MHz
  if {$cmd == "33"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.pmr &
    return 1
  }

# 34 Bac à Sable
  if {$cmd == "34"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.bac &
    return 1
  }

# 36 Réseau 2
  if {$cmd == "36"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.res2 &
    return 1
  }

# 37 Réseau 3
  if {$cmd == "37"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.res3 &
    return 1
  }

# 38 Réseau 4
  if {$cmd == "38"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.res4 &
    return 1
  }

# 49 Ri49
  if {$cmd == "49"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.ri49 &
    return 1
  }

# 66 Girondin
  if {$cmd == "66"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.gir &
    return 1
  }

# 96 RRF
  if {$cmd == "96"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.rrf &
    return 1
  }

# 98 Salon Technique
  if {$cmd == "98"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.tec &
    return 1
  }

# 100 Salon Bavardage
  if {$cmd == "100"} {
    puts "Executing external command"
    playMsg "Core" "online"
    exec nohup /etc/weblink/restart.bav &
    return 1
  }

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
    puts "$logic_name: Sending long identification ..";
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
      puts "$logic_name: Sending short identification ..";
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

set short_announce_pad 0;

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

addMinuteTickSubscriber yopAnnonce;

}
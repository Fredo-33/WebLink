namespace eval PropagationMonitor {

if {![info exists CFG_ID]} {
  return;
}

set module_name [namespace tail [namespace current]];

proc printInfo {msg} {
  variable module_name;
  puts "$module_name: $msg";
}

proc processEvent {ev} {
  variable module_name
  ::processEvent "$module_name" "$ev"
}

proc activateInit {} {
  printInfo "Module activated"
}

proc deactivateCleanup {} {
  printInfo "Module deactivated"
}

proc dtmfDigitReceived {char duration} {
  printInfo "DTMF digit $char received with duration $duration milliseconds";
}

proc dtmfCmdReceived {cmd} {
  if {$cmd == "0"} {
    processEvent "play_help"
  } elseif {$cmd == ""} {
    deactivateModule
  } else {
    processEvent "unknown_command $cmd"
  }
}

proc dtmfCmdReceivedWhenIdle {cmd} {
}

proc squelchOpen {is_open} {
  if {$is_open} {set str "OPEN"} else {set str "CLOSED"};
  printInfo "The squelch is $str";
}

proc allMsgsWritten {} {
}

proc subject_of_msg {msg_file} {
  set subject ""
  set chan [open "$msg_file"]
  while {[gets $chan line] >= 0} {
    if [regexp {^Subject: (.*)$} $line -> subject] {
      break
    }
  }
  close $chan
  return "$subject"
}

proc handle_dxrobot {msg_file} {
  set subject [subject_of_msg "$msg_file"]
  printInfo $subject

  if {![regexp {^(\w{3}) (\d{4}) (\w+): (.*?)(?: - (.*))?$} $subject -> dow time tz alerttxt info]} {
    printInfo "*** WARNING: Unknown message format for DXRobot alert in $msg_file: $subject"
    return
  }

  set hour [clock format [clock scan $time] -format "%H"]
  set min [clock format [clock scan $time] -format "%M"]

  if {$alerttxt == "VHF AURORA WARNING"} {
    processEvent "dxrobot_aurora_alert $hour $min"
    return
  }

  set match [regexp {^(\d+) MHz E-skip Alert$} $alerttxt -> fq_band]
  if {$match} {
    if [regexp {^(\d+) (\w+) Band open from (.+) to (.+)$} $info -> band_num band_unit from to] {
      set band "${band_num}${band_unit}"
      processEvent "dxrobot_eskip_alert $hour $min $band $from $to"
    } else {
      set band "[expr {300/$fq_band}]m"
      processEvent "dxrobot_eskip_alert $hour $min $band"
    }
    return
  }

  printInfo "*** WARNING: Unknown DXRobot alert encountered in $msg_file: $subject"
}


proc handle_vhfdx {msg_file} {
  set subject [subject_of_msg "$msg_file"]
  printInfo $subject

  set match [regexp \
	{^Sporadic-E opening on (\d+c?m)\. Best estimated MUF (\d+) MHz above (\w\w\d\d)$} \
	$subject -> band muf locator]
  if {$match} {
    processEvent "vhfdx_sporadic_e_opening $band $muf $locator"
    return
  }

  set match [regexp \
	{^Possible Sporadic-E from (\w\w\d\d) on (\d+c?m)\. Try towards (\w\w\d\d) \((\d+) degrees\)$} \
	$subject -> from_loc band to_loc direction]
  if {$match} {
    processEvent "vhfdx_possible_sporadic_e_opening $band $from_loc $to_loc $direction"
    return
  }

  set match [regexp \
	{^Multi-hop sporadic-E opening on (\d+c?m)\.$} \
	$subject -> band]
  if {$match} {
    processEvent "vhfdx_multi_hop_sporadic_e_opening $band"
    return
  }

  set match [regexp \
	{^Tropo opening on (\d+c?m)\. up to (\d+) km. between (.*?)\((\w\w\d\d(?:\w\w)?)\) and (.*?)\((\w\w\d\d(?:\w\w)?)\)$} \
	$subject -> band range call1 loc1 call2 loc2]
  if {$match} {
    processEvent "vhfdx_tropo_opening $band $range $call1 $loc1 $call2 $loc2"
    return
  }

  set match [regexp \
	{^Aurora active on (\d+c?m)\. down to (\d+).* of Lat. / (.*?)\((\w\w\d\d(?:\w\w)?)\)$} \
	$subject -> band lat call loc]
  if {$match} {
    processEvent "vhfdx_aurora_opening $band $lat $call $loc"
    return
  }

  set match [regexp \
	{^FAI active on (\d+c?m)\.$} \
	$subject -> band ]
  if {$match} {
    processEvent "vhfdx_fai_active $band"
    return;
  }

  set match [regexp \
	{^TEP opening on (\d+c?m)\.$} \
	$subject -> band ]
  if {$match} {
    processEvent "vhfdx_tep_opening $band"
    return;
  }

  set match [regexp \
	{^F2 opening on (\d+c?m)\.$} \
	$subject -> band ]
  if {$match} {
    processEvent "vhfdx_f2_opening $band"
    return;
  }

  if {($subject == "DX-Sherlock warnings configuration change") ||
      ($subject == "DX-Sherlock new password")} {
    return;
  }

  printInfo "*** WARNING: Unknown VHFDX alert encountered in $msg_file: $subject"
}

proc check_dir {dir} {
  variable CFG_SPOOL_DIR

  foreach msg_file [glob -nocomplain -directory "$CFG_SPOOL_DIR/$dir" msg.*] {
    handle_$dir "$msg_file"
    set target "[file dirname $msg_file]/archive/[file tail $msg_file]"
    file delete "$target"
    file rename "$msg_file" "$target"
  }
}

proc check_for_alerts {} {
  check_dir vhfdx
  check_dir dxrobot
}

if {![file exists $CFG_SPOOL_DIR/dxrobot/archive]} {
  file mkdir $CFG_SPOOL_DIR/dxrobot/archive
}

if {![file exists $CFG_SPOOL_DIR/vhfdx/archive]} {
  file mkdir $CFG_SPOOL_DIR/vhfdx/archive
}

append func $module_name "::check_for_alerts";
Logic::addMinuteTickSubscriber $func;

}
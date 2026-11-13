namespace eval Trx {

if {![info exists CFG_ID]} {
  return;
}

set module_name [namespace tail [namespace current]];

variable current_fq 0

proc playMsg {msg} {
  variable module_name;
  ::playMsg $module_name $msg;
}

proc printInfo {msg} {
  variable module_name;
  puts "$module_name: $msg";
}

proc activating_module {} {
  variable module_name;
  Module::activating_module $module_name;
}

proc deactivating_module {} {
  variable module_name;
  Module::deactivating_module $module_name;
}

proc timeout {} {
  variable module_name;
  Module::timeout $module_name;
}

proc play_help {} {
  variable module_name;
  Module::play_help $module_name;
}

proc status_report {} {
  variable current_fq
  if {$current_fq > 0} {
    playFrequency $current_fq
  }
}

proc set_frequency {fq} {
  variable current_fq
  set current_fq $fq
  if {$fq > 0} {
    playFrequency $fq
    playMsg "ok"
  }
}

proc no_matching_band {cmd} {
  spellNumber $cmd
  playMsg "operation_failed"
}

proc failed_to_set_trx {cmd rx_name tx_name} {
  spellNumber $cmd
  playMsg "operation_failed"
}

proc play_current_fq {} {
  variable current_fq
  if {$current_fq > 0} {
    playFrequency $current_fq
  } else {
    playMsg "not_active"
  }
}

}
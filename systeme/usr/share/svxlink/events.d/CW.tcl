namespace eval CW {

variable short_len;
variable long_len;
variable char_spacing;
variable letter_spacing;
variable word_spacing;

variable fq;

variable amplitude;

array set letters {
  "A" ".-"
  "B" "-..."
  "C" "-.-."
  "D" "-.."
  "E" "."
  "F" "..-."
  "G" "--."
  "H" "...."
  "I" ".."
  "J" ".---"
  "K" "-.-"
  "L" ".-.."
  "M" "--"
  "N" "-."
  "O" "---"
  "P" ".--."
  "Q" "--.-"
  "R" ".-."
  "S" "..."
  "T" "-"
  "U" "..-"
  "V" "...-"
  "W" ".--"
  "X" "-..-"
  "Y" "-.--"
  "Z" "--.."

  "0" "-----"
  "1" ".----"
  "2" "..---"
  "3" "...--"
  "4" "....-"
  "5" "....."
  "6" "-...."
  "7" "--..."
  "8" "---.."
  "9" "----."

  "." ".-.-.-"
  "," "--..--"
  "?" "..--.."
  "/" "-..-."
  "=" "-...-"

  " " " "
}

proc calculateTimings {} {
  variable short_len;
  variable long_len [expr $short_len * 3];
  variable char_spacing $short_len;
  variable letter_spacing [expr $short_len * 3];
  variable word_spacing [expr $short_len * 7];
}

proc setWpm {wpm} {
  variable short_len [expr 60000 / (50 * $wpm)];
  calculateTimings;
}

proc setCpm {cpm} {
  variable short_len [expr 60000 / (10 * $cpm)];
  calculateTimings;
}

proc setPitch {new_fq} {
  variable fq $new_fq;
}

proc setAmplitude {new_amplitude} {
  if {$new_amplitude > 0} {
    set db_str [format "%.2f" [expr 20.0 * log10($new_amplitude / 1000.0)]]
    puts "*** WARNING: Deprecated CW amplitude specification: $new_amplitude."
    puts "             Use the equivalent $db_str (dB) instead."
    variable amplitude $new_amplitude
  } else {
    variable amplitude [expr round(1000.0 * pow(10.0, $new_amplitude / 20.0))]
  }
}

proc loadDefaults {} {
  variable ::Logic::CFG_CW_AMP
  variable ::Logic::CFG_CW_CPM
  variable ::Logic::CFG_CW_WPM
  variable ::Logic::CFG_CW_PITCH

  if [info exists CFG_CW_AMP] {
    setAmplitude $CFG_CW_AMP
  } else {
    setAmplitude -6
  }

  if [info exists CFG_CW_CPM] {
    setCpm $CFG_CW_CPM
  } elseif [info exists CFG_CW_WPM] {
    setWpm $CFG_CW_WPM
  } else {
    setCpm 100
  }

  if [info exists CFG_CW_PITCH] {
    setPitch $CFG_CW_PITCH
  } else {
    setPitch 800
  }

  calculateTimings
}

proc play {txt {cpm 0} {pitch 0} {amp -1000000}} {
  variable short_len;
  variable long_len;
  variable char_spacing;
  variable letter_spacing;
  variable word_spacing;
  variable fq;
  variable amplitude;
  variable letters;

  set load_defaults 0
  if {$cpm > 0} {
    setCpm $cpm
    set load_defaults 1
  }
  if {$pitch > 0} {
    setPitch $pitch
    set load_defaults 1
  }
  if {$amp > -1000000} {
    setAmplitude $amp
    set load_defaults 1
  }

  set txt [string toupper $txt];
  set first_letter 1;
  foreach letter [split $txt ""] {
    if {!$first_letter} {
      playSilence $letter_spacing;
    }
    set first_letter 0;
    set first_char 1;
    foreach char [split $letters($letter) ""] {
      if {!$first_char} {
      	playSilence $char_spacing;
      }
      set first_char 0;
      if {$char == "."} {
      	playTone $fq $amplitude $short_len;
      } elseif {$char == "-"} {
      	playTone $fq $amplitude $long_len;
      } elseif {$char == " "} {
      	playSilence $word_spacing;
      }
    }
  }

  if {$load_defaults} {
    loadDefaults
  }
}

loadDefaults

}
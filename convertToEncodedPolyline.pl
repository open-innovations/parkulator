#!/usr/bin/perl
use JSON::XS;
use Data::Dumper;

$file = $ARGV[0];
if(-e $file){
	open(FILE,$ARGV[0]);
	@lines = <FILE>;
	close(FILE);
	$str = join("\n",@lines);
}else{
	$str = "{\"Features\":[{\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[$file]]}}]}";
}

%geojson = %{JSON::XS->new->utf8->decode($str)};
if($geojson{'features'}){
	@features = @{$geojson{'features'}};	
}elsif($geojson{'Features'}){
	@features = @{$geojson{'Features'}};
}

$str = "";

for($f = 0; $f < @features; $f++){
	if($features[$f]{'geometry'}{'type'} eq "MultiPolygon"){
		$line = "";
		for($i = 0; $i < @{$features[$f]{'geometry'}{'coordinates'}}; $i++){
			for($j = 0; $j < @{$features[$f]{'geometry'}{'coordinates'}[$i]}; $j++){
				$line .= ($line ? " " : "").polylineEncode(@{$features[$f]{'geometry'}{'coordinates'}[$i][$j]});
			}
		}
		$str .= $line;
	}elsif($features[$f]{'geometry'}{'type'} eq "Polygon"){
		$line = "";
		for($i = 0; $i < @{$features[$f]{'geometry'}{'coordinates'}}; $i++){
			$line .= ($line ? " " : "").polylineEncode(@{$features[$f]{'geometry'}{'coordinates'}[$i]});
		}
		$str .= $line;
	}else{
		print "WARNING: Type for feature $f is $features[$f]{'geometry'}{'type'}\n";
		print Dumper $features[$f];
	}
	$str .= "\n";
}

if($ARGV[1]){
	open(FILE,">",$ARGV[1]);
	print FILE $str;
	close(FILE);
}else{
	print $str;
}

##########################

sub floor {
	return int($_[0]);
}

sub py2_round {
	my $value = $_[0];
	# Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
	return floor(abs($value) + 0.5) * ($value >= 0 ? 1 : -1);
}

sub encode {
	my ($current,$previous,$factor) = @_;

	# Step 2: Take the decimal value and multiply it by 1e5, rounding the result:
	$current = py2_round($current * $factor);
	$previous = py2_round($previous * $factor);

	my $coordinate = $current - $previous;
	
	# Step 4 Left-shift the binary value one bit
	$coordinate <<= 1;
    if($current - $previous < 0) {
        $coordinate = ~$coordinate;
    }
	my $output = '';
    while($coordinate >= 0x20) {
		$output .= chr((0x20 | ($coordinate & 0x1f)) + 63);
        $coordinate >>= 5;
    }
	$output .= chr($coordinate + 63);
	return $output;
}


# Encodes the given [latitude, longitude] coordinates array.
# @param {Array.<Array.<Number>>} coordinates
# @returns {String}
sub polylineEncode {
	my (@coordinates) = @_;

	my ($i,@a,@b);
	my $factor = 1e5;
	my $output = encode($coordinates[0][0], 0, $factor) . encode($coordinates[0][1], 0, $factor);

	for($i = 1; $i < @coordinates; $i++) {
		@a = @{$coordinates[$i]};
		@b = @{$coordinates[$i - 1]};
        $output .= encode($a[0], $b[0], $factor);
        $output .= encode($a[1], $b[1], $factor);
    }

    return $output;
}


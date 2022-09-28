#!/usr/bin/perl

use utf8;

#http://download.geonames.org/export/dump/cities15000.zip
$file = "cities15000.txt";
open(FILE,$file);
@lines = <FILE>;
close(FILE);
$n = @lines;
$delim = "\t";


@result;
$sortby = 'population';
$order = "reverse";
@headers = ("geonameid","name","asciiname","alternatenames","latitude","longitude","feature class","feature code","country code","cc2","admin1 code","admin2 code","admin3 code","admin4 code","population","elevation","dem","timezone","modification date");

for($i = 0 ; $i < $n; $i++){
	$lines[$i] =~ s/[\n\r]//g;
	(@cols) = split($delim,$lines[$i]);
	$result[$i] = {};
	for($c = 0; $c < @cols; $c++){
		$result[$i]->{$headers[$c]} = $cols[$c];
	}
}
@result = orderit(@result);
#for($i = 0; $i < @result; $i++){
#	print $result[$i]->{'name'}." - ".$result[$i]->{'population'}."\n";
#}

@results;

for($i = 0; $i < @result; $i++){
	
	$pop2 = int($result[$i]->{'population'}/15000);
	$lat = sprintf("%.4f",$result[$i]->{'latitude'});
	$lon = sprintf("%.4f",$result[$i]->{'longitude'});
	$name = $result[$i]->{'name'};
	$ascii = $result[$i]->{'asciiname'};
	$cc = $result[$i]->{'country code'};
	$admin1 = $result[$i]->{'admin1 code'};
	$id = $result[$i]->{'geonameid'};
	
	if($name eq $ascii){
		$line = "$id\t$name\t\t$cc\t$admin1\t$pop2";
	}else{
		$line = "$id\t$name\t$ascii\t$cc\t$admin1\t$pop2";	
	}

	if(!$ascii){ $ascii = $name; }
	$fl = "";
	if($ascii){
		$fl = lc(substr($ascii,0,1));
	}else{
#		$fl = lc(substr($name,0,1));
	}

	if($fl){
		$dbold{$id} = "$line";
		$n = @{$results{$fl}};
		if(!$n){ $n = 0 };
		
		if($result[$i]->{'timezone'}){
			$db{$fl."-".$n} = "$lat\t$lon\t$result[$i]->{'timezone'}";
			push(@{$results{$fl}},$line);
		}
	}
}

%cities;
$binning = 100;

%files;

foreach $l (sort(keys(%results))){
print $l."\n";
	$n = @{$results{$l}};
	open(FILE,">","ranked-$l.tsv");
	for($i = 0; $i < $n; $i++){
		if($i > 0){ print FILE "\n"; } 
		$out = $results{$l}[$i];
		$out =~ s/^([^\t]+)\t//g;
		$id = $1;
		$j = int($i/$binning);
		$file = "cities/$l-$j.tsv";
if($l eq "h"){
	print "$i - $out ($file)\n";
}
		if(!$files{$file}){ $files{$file} = (); }

		if($i == $j){
			# Remove the file
			if($file && -e $file){
				`rm "$file"`;
			}
		}
		#push(@{$cities{$l}},$i."\t".$db{$l."-".$i});
#		open(CITY,">","cities/".$l."-".$i.".tsv");
#		print CITY "".$db{$l."-".$i}."\n";
#		close(CITY);
		#push(@{$cities{$l}},$i."\t".$db{$l."-".$i});
#if($l eq "h"){
		push(@{$files{$file}},"$i\t".$db{$l."-".$i});
#}
#		open(CITY,">>",$file);
#		print CITY "$i\t".$db{$l."-".$i}."\n";
#		close(CITY);
		print FILE "$out";
	}
	close(FILE);
}

foreach $file (keys(%files)){
	$n = @{$files{$file}};
	open(CITY,">",$file);
	for($i = 0; $i < $n ; $i++){
		print CITY $files{$file}[$i]."\n";
	}
	close(CITY);
#	print "$file - $n\n";
}

sub orderit {
	my @in = @_;
	my @sorted = ($in[0]->{$column} =~ /[a-zA-Z]/) ? (sort { lc($a->{$sortby}) cmp lc($b->{$sortby}) } @in) : (sort { $a->{$sortby} <=> $b->{$sortby} } @in);
	if($order eq "reverse"){ @sorted = reverse(@sorted); }
	return @sorted;
}

#!/usr/bin/perl

use Data::Dumper;

# Open the index of areas
open(FILE,"areas.tsv");
@lines = <FILE>;
close(FILE);

%lookup;

foreach $line (@lines){

	# Remove newlines
	$line =~ s/[\n\r]//g;

	# If we have a line, split it by a tab character
	if($line){
		($code,$name) = split(/\t/,$line);

		# Take a copy of the name and replace commas and "&" with a pipe
		$tname = $name;
		$tname =~ s/(\, | \& )/\|/g;

		# Split to find the name fragments
		@names = split(/\|/,$tname);

		for($n = 0; $n < @names; $n++){
			# Get the first letter of this name fragment
			$fl = uc(substr($names[$n],0,1));

			# Store a copy of the name keyed by the first letter and code
			if(!$lookup{$fl}){ $lookup{$fl} = {}; }
			$lookup{$fl}{$code} = $name;
		}
	}
}

# Save a file for each starting letter
foreach $l (sort(keys(%lookup))){
	open(FILE,">","search/$l.tsv");
	foreach $code (sort(keys(%{$lookup{$l}}))){
		print FILE "$code\t$lookup{$l}{$code}\n";
	}
	close(FILE);
}
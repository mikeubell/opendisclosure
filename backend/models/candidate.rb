require 'csv'

class Candidate < ActiveRecord::Base
  self.inheritance_column = 'something_that_isnt_the_word_type'

  belongs_to :race, class_name: 'Race'
  belongs_to :committee, class_name: 'Party'

  def self.load_candidates(csv)
    transaction do
      CSV.parse(open(csv).read, headers: :first_row) do |row|
	jurisdiction = row['Race'];
	date = jurisdiction.slice!(jurisdiction.index(":")+1..-1);
	jurisdiction.slice!(-1);
	race = date.slice!(date.index(":")+1..-1);
	date.slice!(-1);
	puts "#{jurisdiction}|#{date}|#{race}";
	election_id =  Election.where(jurisdiction: jurisdiction, election_date: date).first_or_create.id;

	committee = Party::Committee.where(committee_id: row['Committee']).take;
	if committee.nil?
	  committeeID = 0;
	else
	  committeeId = committee.id;
	end
	Candidate.create(
	  race_id: Race.where(election_id: election_id, type: 'office', name: race).first_or_create.id,
	  committee_id: committeeId,
	  name: row['Name'],
	  declared: row['Declared'],
	  profession: row['Profession'],
	  party: row['Party'],
	  twitter: row['Twitter'],
	  bio: row['Bio']
	)
      end
    end
  end
end


require 'csv'

class Race < ActiveRecord::Base
  self.inheritance_column = 'something_that_isnt_the_word_type'
  has_many :candidates,
    foreign_key: :race_id,
    class_name: 'Candidate'
 
  belongs_to :election, class_name: 'Election'

  def self.load_races(csv)
    transaction do
      CSV.parse(open(csv).read, headers: :first_row) do |row|
	jurisdiction = row['Election'];
	date = jurisdiction.slice!(jurisdiction.index(":")+1..-1);
	jurisdiction.slice!(-1);
	puts "#{jurisdiction}|#{date}";
	Race.create(
	  election_id: Election.where(jurisdiction: jurisdiction, election_date: date).first_or_create.id,
	  type: row['Type'],
	  name: row['Name'],
	  location_id: row['Location'], #TBD
	  description: row['Description']
	)
      end
    end
  end
end


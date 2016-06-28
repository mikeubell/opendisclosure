require 'csv'

class Election < ActiveRecord::Base
  self.inheritance_column = 'something_that_isnt_the_word_type'

  has_many :races,
    foreign_key: :election_id,
    class_name: 'Race'

  def self.load_elections(csv)
    transaction do
      CSV.parse(open(csv).read, headers: :first_row) do |row|
       Election.create(
         jurisdiction: row['Jurisdiction'],
         election_date: row['Date'],
         image_path: row['Image'],
         catchphrase: row['Catchphrase']
       )
      end
    end
  end
end


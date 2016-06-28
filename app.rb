require 'sinatra'
require 'sinatra/content_for'
require 'sinatra/asset_pipeline'
require 'handlebars_assets'
require 'active_record'
require 'sass'
require 'haml'

Dir['./backend/models/*.rb'].each { |f| require f }

class OpenDisclosureApp < Sinatra::Application
  class << self
    # Include helpers like image_path so that the ActiveRecord models can use
    # them to generate urls.
    include Sprockets::Helpers
  end

  configure do
    ENV['DATABASE_URL'] ||= "postgres://localhost/postgres"
    ActiveRecord::Base.establish_connection
    ActiveRecord::Base.connection.verify!
  end

  set :assets_precompile, %w(application.js application.css *.png *.jpg *.svg *.eot *.ttf *.woff *.ico)
  set :assets_prefix, %w(assets vendor/assets) + [File.dirname(HandlebarsAssets.path)]

  register Sinatra::AssetPipeline
  use Rack::Deflater

  # Below here are some API endpoints for the frontend JS to use to fetch data.
  #
  # This uses a special ActiveRecord syntax for converting models to JSON. It is
  # documented here:
  #   http://apidock.com/rails/ActiveRecord/Serialization/to_json

  # Get information about elections
  get '/api/elections' do 
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'
    Election.all.to_json
  end

  get '/api/election/:jurisdiction' do |jurisdiction|
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'
    Election.where(jurisdiction: jurisdiction).all.to_json
  end

  get '/api/races/:jurisdiction/:date' do |jurisdiction, date|
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      include: [
      :races
      ]
    }
    Election.find_by(jurisdiction: jurisdiction, election_date: date).to_json(fields)
    # id = Election.where(jurisdiction: jurisdiction, election_date: date).first.id;
    # Race.includes(:election).where(election_id: id).to_json(fields)
  end

  get '/api/candidates/:jurisdiction/:date/:race' do |jurisdiction, date, race|
    cache_control :public
    last_modified Import.last.import_time

    fields = {
        include: [
        { committee: { methods: [ :short_name, :summary ] } },
        { race: {include: "election" } }
      ]
    }
    headers 'Content-Type' => 'application/json'
    id = Election.where(jurisdiction: jurisdiction, election_date: date).first.id;
    id = Race.where(election_id: id, name: race).first.id;
    Candidate.where(race_id: id).to_json(fields);
  end

  # This is data of contributions from an individual/company to various campaigns.
  get '/api/contributor/:id' do |id|
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      include: [
        { recipient: { methods: :short_name } },
        { contributor: { methods: :short_name } },
      ],
    }
    party = Party.find(id)
    Contribution
      .where(contributor_id: party)
      .includes(:contributor, :recipient).order(:date).reverse_order.to_json(fields)
  end

  get '/api/contributorName/:name' do |name|
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      include: [
        { recipient: { methods: :short_name } },
        { contributor: { methods: :short_name } },
      ],
    }
    search    = "%" + CGI.unescape(name).downcase + "%"
    party         = Party.where("lower(name) like ?", search)
    Contribution
      .where(contributor_id: party)
      .includes(:contributor, :recipient).order(:date).reverse_order.to_json(fields)
  end

  get '/api/contributions/:type/?:id?' do |type, id|
    # TODO: Figure out how to cache this
    # cache_control :public
    # last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      only: %w[amount date type],
      include: [
        { recipient: { methods: :short_name } },
        { contributor: { methods: :short_name } },
      ],
    }

    case type
    when 'zip'
      Contribution
        .joins(:recipient, :contributor)
        .where(recipient_id: Party.mayoral_candidates.to_a)
        .where(self_contribution: false)
        .group('contributors_contributions.zip, parties.committee_id')
        .pluck('contributors_contributions.zip, parties.committee_id, sum(contributions.amount)')
        .each_with_object({}) do |(zip, committee_id, amount), hash|
            candidate_name = Party::CANDIDATE_INFO[committee_id][:name]
            hash[zip] ||= Hash.new(0)
            hash[zip][candidate_name] += amount
          end
        .each do |zip, candidate_hash|
            leader, _max = candidate_hash.max_by { |_candidate, amount| amount }
            total        = candidate_hash.sum    { |_candidate, amount| amount }
            candidate_hash['leader'] = leader
            candidate_hash['total'] = total
          end
        .to_json
    when 'over_time'
      names_by_id = Hash[Party.mayoral_candidates.map { |c| [c.id, c.short_name] }]
      total_amount_by_candidate = Hash.new(0)

      Contribution
        .where(recipient_id: Party.mayoral_candidates.to_a)
        .order(:date)
        .pluck(:amount, :recipient_id, :date)
        .each_with_object({}) do |(amount, recipient_id, date), hash|
            candidate_name             = names_by_id[recipient_id]
            # Since we process data points in date order, if this date's total
            # isn't defined we should start with the previous total.
            hash[recipient_id]       ||= {}
            hash[recipient_id][date] ||= total_amount_by_candidate[recipient_id]

            # And actually update the totals counters:
            total_amount_by_candidate[recipient_id] += amount
            hash[recipient_id][date]                += amount
          end
        .each_with_object({}) do |(recipient_id, amount_by_date), hash|
            candidate_name = names_by_id[recipient_id]

            amount_by_date.each do |date, amount|
              hash[candidate_name] ||= []
              hash[candidate_name] << {
                'amount' => amount,
                'close' => amount,    # hack needed by D3 (??, ask Ian)
                'date' => date,
              }
            end
          end
        .to_json
    when 'candidate'
      Contribution
        .where(recipient_id: id)
        .includes(:recipient, :contributor)
        .order(date: :desc)
        .to_json(fields)
    when 'committee'
      search    = "%" + CGI.unescape(id).downcase.gsub(/-/, '_') + "%"
      party         = Party::Committee.where("lower(name) like ?", search)
      Contribution
        .where(recipient_id: party)
        .includes(:recipient, :contributor)
        .order(recipient_id: :asc).order(date: :desc)
        .to_json(fields)
    else
      # TODO: Remove this once we no longer hit /api/contributions
      Contribution
        .where(recipient_id: Party.mayoral_candidates.to_a)
        .includes(:recipient, :contributor)
        .order(date: :desc)
        .to_json(fields)
    end
  end

  get '/api/employer_contributions' do
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    EmployerContribution.all.to_json
  end

  get '/api/category_contributions' do
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    CategoryContribution.all.to_json
  end

  get '/api/payments/:id' do |id|
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      only: %w[amount date code],
      include: [
        { recipient: { methods: :short_name } },
        { payer: { methods: :short_name } },
      ],
    }
    Payment
      .where(payer_id: id)
      .includes(:recipient, :payer)
      .order(date: :desc)
      .to_json(fields)
  end

  get '/api/category_payments' do
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    CategoryPayment.order(code: :asc).all.to_json
  end

  get '/api/whales' do
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      only: %[amount],
      include: [:contributor],
    }

    Whale.includes(:contributor).to_json(fields)
  end

  get '/api/multiples' do
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      only: %[number],
      include: [:contributor],
    }

    Multiple.includes(:contributor).to_json(fields);
  end

  get '/api/independent' do
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      include: [
        { recipient: { methods: :short_name } },
        { contributor: { methods: :short_name } },
      ],
    }

    IEC.includes(:contributor, :recipient)
       .order('extract(year from date)').reverse_order
       .order(:contributor_id).to_json(fields)
  end

  get '/api/party/:id' do |id|
    cache_control :public
    last_modified Import.last.import_time

    # TODO: Include names of the people contributing?
    headers 'Content-Type' => 'application/json'

    fields = {
      only: %w[id name committee_id received_contributions_count contributions_count received_contributions_from_oakland small_contributions],
      include: {
        received_contributions: { },
        contributions: { }
      }
    }

    Party.find(id).to_json(fields)
  end

  get '/api/employees/:employer_id' do |employer_id|
    cache_control :public
    last_modified Import.last.import_time

    headers 'Content-Type' => 'application/json'

    fields = {
      only: %w[amount date type],
      include: [
        { recipient: { methods: :short_name } },
        { contributor: { methods: :short_name } },
      ],
    }
    Contribution
      .includes(:contributor, :recipient)
      .joins('JOIN parties on contributor_id = parties.id')
      .where("parties.employer_id = ?", params[:employer_id])
      .order(:date).reverse_order
      .to_json(fields)
  end

  get '/sitemap.xml' do
    send_file 'public/sitemap.xml.gz'
  end

  get '/robots.txt' do
    send_file 'public/robots.txt'
  end

  get '*' do
    most_recently_updated_party = Party.where('last_updated_date is not null')
                                       .order(last_updated_date: :desc)
                                       .first

    # This renders views/index.haml
    haml :index, locals: {
      candidates: Party.all_mayoral_candidates,
      last_updated: most_recently_updated_party.try(:last_updated_date) || Time.now,
      candidate_json: candidate_json
    }
  end

  # This JSON is put (bootstrapped) into every response because it's crucial for
  # displaying the above-the-fold content (the candidate table).
  def candidate_json
    fields = {
      only: %w[
        id name committee_id received_contributions_count contributions_count
        received_contributions_from_oakland self_contributions_total small_contributions
        last_updated_date
      ],
      methods: [
        :summary,
        :short_name,
        :declared,
        :profession,
        :party_affiliation,
        :image,
        :twitter,
        :bio,
        :sources,
      ],
    }

    Party.all_mayoral_candidates.to_json(fields)
  end

  after do
    ActiveRecord::Base.connection.close
  end
end

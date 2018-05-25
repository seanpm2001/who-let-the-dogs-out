const Match = require('./match.model');
const scrapper = require('../scrappers/master.scrapper');


/**
 * Get match list.
 * @property {number} req.query.skip - Number of matches to be skipped.
 * @property {number} req.query.limit - Limit number of matches to be returned.
 * @returns {Match[]}
 */
const list = (req, res, next) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  Match.list(startDate, endDate)
    .then(matches => res.json(matches))
    .catch(e => next(e));
};

/**
 * Save the passed match in the database.
 * @param newMatch
 * @returns {Promise}
 * @private
 */
const _createMatch = newMatch => {
  const match = new Match(newMatch);
  return match.save();
};

/**
 * Update an already existing match.
 * @param info
 * @param match
 */
const _updateMatch = (info, match) => {
  match.stadium = info.stadium;
  match.matchDate = info.matchDate;
  match.homeTeamScore = info.homeTeamScore;
  match.awayTeamScore = info.awayTeamScore;
  return match.save();
};

/**
 * Search a scrapped Match on DB, if exists update it,
 *                                else create a new Match
 *
 * FIXME: This is not the most efficient way, in fact, this is trash, but works (maybe).
 */
const _saveMatch = (scrappedMatch) => {
  const query = {};
  query.homeTeam = scrappedMatch.homeTeam;
  query.awayTeam = scrappedMatch.awayTeam;
  query.league = scrappedMatch.league;
  query.round = scrappedMatch.round;

  return Match.find(query).then((foundMatches) => {
    if(foundMatches.length > 0) {
      const match = foundMatches[0];
      return _updateMatch(scrappedMatch, match);
    } else {
      return _createMatch(scrappedMatch);
    }
  });
};

/**
 * Scrap and update our collection of Matches.
 */
const updateMatchesCollection = (req, res, next) => {
  scrapper.getAllMatches().then((arrayOfArraysOfMatches) => {
    const promises = [];
    arrayOfArraysOfMatches.forEach((arrayOfMatches) => {
      arrayOfMatches.forEach((match) => {
        promises.push(_saveMatch(match));
      });
    });
    Promise.all(promises)
      .then(() => res.json({}))
      .catch(e => next(e));
  });
};

module.exports = {list, updateMatchesCollection};

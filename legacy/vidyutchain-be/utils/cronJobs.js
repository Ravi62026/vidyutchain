import cron from 'node-cron';
import Tender from '../model/tender.js';
import Bid from '../model/bid.js';
import logger from './logger.js';

// Function to award bid to highest bidder for a specific tender
const awardBidToHighestBidder = async (tender) => {
  try {
    // Get all bids for this tender
    const bids = await Bid.find({ tender: tender._id })
      .sort({ amount: -1 }) // Sort by amount in descending order
      .populate('bidder', 'email walletAddress');
    
    if (bids.length === 0) {
      logger.info(`No bids found for tender ${tender._id} - ${tender.title}`);
      // Update tender to closed without awarding
      tender.status = 'closed';
      await tender.save();
      return null;
    }
    
    // Select the highest bid
    const highestBid = bids[0];
    logger.info(`Awarding tender ${tender._id} to highest bid: ${highestBid._id} with amount: ${highestBid.amount}`);

    // Update tender
    tender.status = 'awarded';
    tender.awardedTo = highestBid._id;
    tender.transactionSignature = 'auto-awarded';
    await tender.save();

    // Update highest bid
    highestBid.status = 'accepted';
    highestBid.transactionSignature = 'auto-awarded';
    await highestBid.save();

    // Update all other bids to rejected
    await Bid.updateMany(
      { 
        tender: tender._id, 
        _id: { $ne: highestBid._id } 
      },
      { 
        status: 'rejected',
      }
    );

    return {
      tender,
      awardedBid: highestBid
    };
  } catch (error) {
    logger.error(`Error awarding bid for tender ${tender._id}: ${error.message}`);
    return null;
  }
};

// Function to check for expired tenders and award them
const autoAwardExpiredTenders = async () => {
  try {
    // Get current timestamp with precision to the second
    const currentDate = new Date();
    
    logger.info(`Checking for expired tenders at ${currentDate.toISOString()}`);
    
    // Find tenders that have passed their end date and time but are still open
    const expiredTenders = await Tender.find({
      endDate: { $lt: currentDate },
      status: 'open'
    });
    
    logger.info(`Found ${expiredTenders.length} expired tenders to process`);
    
    // Process each expired tender
    for (const tender of expiredTenders) {
      logger.info(`Processing tender ${tender._id} - "${tender.title}" which expired at ${new Date(tender.endDate).toISOString()}`);
      
      // First update tender status to closed
      tender.status = 'closed';
      await tender.save();
      
      // Then award the bid to the highest bidder
      const result = await awardBidToHighestBidder(tender);
      
      if (result) {
        logger.info(`Successfully awarded tender ${tender._id} - ${tender.title} to bid ${result.awardedBid._id}`);
      } else {
        logger.info(`No bids to award for tender ${tender._id} - ${tender.title}`);
      }
    }
  } catch (error) {
    logger.error(`Error in auto-award cron job: ${error.message}`);
  }
};

// Setup cron jobs
export const setupCronJobs = () => {
  // Run every minute to check for expired tenders (for precise time handling)
  cron.schedule('* * * * *', async () => {
    logger.info('Running auto-award cron job for expired tenders');
    await autoAwardExpiredTenders();
  });
  
  // Also run at the start of each hour to ensure no tenders are missed
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly auto-award cleanup job');
    await autoAwardExpiredTenders();
  });
  
  logger.info('Cron jobs scheduled successfully');
};

// Function to run immediately on server start
export const runInitialJobs = async () => {
  logger.info('Running initial auto-award job on server start');
  await autoAwardExpiredTenders();
};

export default { setupCronJobs, runInitialJobs }; 
# WHAT IS THE ADS.TEXT PROJECT?

The mission of the ads.txt project is simple: Increase transparency in the programmatic advertising ecosystem. Ads.txt stands for Authorized Digital Sellers and is a simple, flexible and secure method that publishers and distributors can use to publicly declare the companies they authorize to sell their digital inventory.

By creating a public record of Authorized Digital Sellers, ads.txt will create greater transparency in the inventory supply chain, and give publishers control over their inventory in the market, making it harder for bad actors to profit from selling counterfeit inventory across the ecosystem. As publishers adopt ads.txt, buyers will be able to more easily identify the Authorized Digital Sellers for a participating publisher, allowing brands to have confidence they are buying authentic publisher inventory.

# What is ads.txt?
Ads.txt is a simple, flexible, and secure method for publishers and distributors to declare who is authorized to sell their inventory, improving transparency for programmatic buyers.

Ads.txt supports transparent programmatic digital media transactions and can remove the financial incentive from selling counterfeit and misrepresented media. Similar to robots.txt, ads.txt can only be posted to a domain by a publisher’s webmaster, making it valid and authentic. As a text file, ads.txt is easy to update, making it flexible. The data required to populate the file is readily available in the OpenRTB protocol, making it simple to gather and target. And because publishers sell their inventory through a variety of sales channels, ads.txt supports the following types of supplier relationships:

•	Domain owners who sell on exchanges through their own accounts
•	Networks and sales houses who programmatically sell on behalf of domain owners
•	Content syndication partnerships where multiple authorized sellers represent the same inventory

# WHAT PROBLEM DOES ADS.TXT SOLVE?

The ads.txt project aims to prevent various types of counterfeit inventory across the ecosystem by improving transparency in the digital programmatic supply chain.
When a brand advertiser buys media programmatically, they rely on the fact that the URLs they purchase were legitimately sold by those publishers. The problem is, there is currently no way for a buyer to confirm who is responsible for selling those impressions across exchanges, and there are many different scenarios when the URL passed may not be an accurate representation of what the impression actually is or who is selling it. While every impression already includes publisher information from the OpenRTB protocol, including the page URL and Publisher.ID, there is no record or information confirming who owns each Publisher.ID, nor any way to confirm the validity of the information sent in the RTB bid request, leaving the door open to counterfeit inventory.

Counterfeit inventory – is defined here as a unit of inventory sourced from a domain, app or video that is intentionally mislabeled and offered for sale a different domain, app or video. The motivation to create counterfeit inventory comes in many forms including, to sell invalid traffic (automated non-human, or incentivised/mislead human traffic) by hiding it in real traffic, to attract higher prices by mislabeling inventory as brand inventory, to bypass content or domain blacklists, or to capture advertising spend restricted to whitelisted domains, among others.

Note that this form of “inventory fraud” in advertising is independent of how the traffic is generated. It can potentially include a mix of for example automated (non-human) bot traffic and real human user traffic. It can also exist as a small amount of authentic and valid inventory mixed with mislabeled inventory.

# HOW DOES ADS.TXT WORK?
Ads.txt works by creating a publicly accessible record of authorized digital sellers for publisher inventory that programmatic buyers can index and reference if they wish to purchase inventory from authorized sellers. First, participating publishers must post their list of authorized sellers to their domain. Programmatic buyers can then crawl the web for publisher ads.txt files to create a list of authorized sellers for each participating publisher. Then programmatic buyers can create a filter to match their ads.txt list against the data provided in the OpenRTB bid request.

Example: Example.com publishes ads.txt on their web server listing three exchanges as authorized to sell their inventory, including Example.com’s seller account IDs within each of those exchanges.

http://example.com/ads.txt:
#< SSP/Exchange Domain >, < SellerAccountID >, < PaymentsType >, < TAGID >
greenadexchange.com, 12345, DIRECT, AEC242
blueadexchange.com, 4536, DIRECT
silverssp.com, 9675, RESELLER

Note: The seller’s Publisher.ID will be specified in the “SellerAccountID” field in the ads.txt.
A buyer receiving a bid request claiming to be example.com can verify if the exchange and SellerAccountID matches the authorized sellers listed in example.com/ads.txt file.

# WHERE TO IMPLEMENT ADS.TXT?
Save the file with the name ads.txt, and upload it to the root folder of your domain, such as example.com/ads.txt

# Please implement the following ads.txt
https://github.com/CDPAdSolution/ads.txt/blob/master/ads.txt

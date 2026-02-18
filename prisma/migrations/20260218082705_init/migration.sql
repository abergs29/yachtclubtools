-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('BUY', 'WITHDRAW');

-- CreateEnum
CREATE TYPE "TradeAction" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'ETF', 'CRYPTO', 'CASH');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "shares" DECIMAL(18,6) NOT NULL,
    "type" "ContributionType" NOT NULL DEFAULT 'BUY',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalValue" DECIMAL(18,2) NOT NULL,
    "cashValue" DECIMAL(18,2) NOT NULL,
    "btcPrice" DECIMAL(18,2) NOT NULL,
    "sp500Value" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BtcPurchase" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "btcAmount" DECIMAL(18,8) NOT NULL,
    "usdAmount" DECIMAL(18,2) NOT NULL,
    "btcPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BtcPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ticker" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "action" "TradeAction" NOT NULL,
    "shares" DECIMAL(18,6) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "fees" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,6),
    "lastPrice" DECIMAL(18,4),
    "currentValue" DECIMAL(18,2),
    "totalGainLoss" DECIMAL(18,2),
    "totalGainLossPercent" DECIMAL(18,4),
    "percentOfAccount" DECIMAL(18,4),
    "costBasisTotal" DECIMAL(18,2),
    "averageCostBasis" DECIMAL(18,4),
    "assetType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePosition" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(18,6),
    "asset" TEXT,
    "price" DECIMAL(18,4),
    "cost" DECIMAL(18,2),
    "marketValue" DECIMAL(18,2),
    "gainDollar" DECIMAL(18,2),
    "gainPercent" DECIMAL(18,4),
    "percentOfPortfolio" DECIMAL(18,4),
    "term" TEXT,
    "beta" DECIMAL(18,4),
    "pe" DECIMAL(18,4),
    "weekHigh" DECIMAL(18,4),
    "weekLow" DECIMAL(18,4),
    "gain30" DECIMAL(18,4),
    "gain60" DECIMAL(18,4),
    "gain90" DECIMAL(18,4),
    "weight" DECIMAL(18,4),
    "estPurchase" DECIMAL(18,2),
    "sharesTarget" DECIMAL(18,4),
    "rounded" DECIMAL(18,4),
    "totalPurchase" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketQuote" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(18,6) NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Contribution_date_idx" ON "Contribution"("date");

-- CreateIndex
CREATE INDEX "Contribution_memberId_date_idx" ON "Contribution"("memberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSnapshot_date_key" ON "PortfolioSnapshot"("date");

-- CreateIndex
CREATE INDEX "BtcPurchase_date_idx" ON "BtcPurchase"("date");

-- CreateIndex
CREATE INDEX "Trade_date_idx" ON "Trade"("date");

-- CreateIndex
CREATE INDEX "Trade_ticker_idx" ON "Trade"("ticker");

-- CreateIndex
CREATE INDEX "PositionSnapshot_date_idx" ON "PositionSnapshot"("date");

-- CreateIndex
CREATE INDEX "PositionSnapshot_symbol_idx" ON "PositionSnapshot"("symbol");

-- CreateIndex
CREATE INDEX "LivePosition_date_idx" ON "LivePosition"("date");

-- CreateIndex
CREATE INDEX "LivePosition_symbol_idx" ON "LivePosition"("symbol");

-- CreateIndex
CREATE INDEX "MarketQuote_symbol_asOf_idx" ON "MarketQuote"("symbol", "asOf");

-- CreateIndex
CREATE INDEX "MarketQuote_asOf_idx" ON "MarketQuote"("asOf");

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


import fs from 'node:fs'
import path from 'node:path'
import solc from 'solc'

const projectRoot = path.resolve(import.meta.dirname, '..')
const sourceName = 'contracts/EnergyAudit.sol'
const sourcePath = path.join(projectRoot, sourceName)
const source = fs.readFileSync(sourcePath, 'utf8')
const input = {
  language: 'Solidity',
  sources: { [sourceName]: { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata'] },
    },
  },
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))
const errors = output.errors?.filter((error) => error.severity === 'error') ?? []
if (errors.length > 0) {
  console.error(errors.map((error) => error.formattedMessage).join('\n'))
  process.exit(1)
}

const contract = output.contracts[sourceName].EnergyAudit
const artifact = {
  _format: 'hh-sol-artifact-1',
  contractName: 'EnergyAudit',
  sourceName,
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  linkReferences: {},
  deployedLinkReferences: {},
}

const artifactPath = path.join(projectRoot, 'artifacts', sourceName, 'EnergyAudit.json')
fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`)
console.log(`Compiled ${sourceName} with solc ${solc.version()}`)